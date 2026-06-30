from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.backend.db.database import get_db
from app.backend.models.person import Detection, KnownPerson
from app.backend.schemas.person import (
    DetectionCreate,
    DetectionRead,
    KnownPersonCreate,
    KnownPersonRead,
)
from app.backend.services.face_recognition import match_known_person

router = APIRouter()

@router.post("/known_persons", response_model=KnownPersonRead)
def create_known_person(payload: KnownPersonCreate, db: Session = Depends(get_db)):
    # Verificar si ya existe
    existing = db.query(KnownPerson).filter(
        KnownPerson.name == payload.name,
        KnownPerson.surname == payload.surname
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Known person already exists")
    
    # Crear nueva persona
    person = KnownPerson(
        name=payload.name,
        surname=payload.surname,
        vector=payload.vector,
        person_metadata=payload.person_metadata
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return person

@router.get("/known_persons", response_model=list[KnownPersonRead])
def list_known_persons(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    return db.query(KnownPerson).offset(skip).limit(limit).all()

@router.get("/known_persons/stats")
def get_known_persons_stats(db: Session = Depends(get_db)):
    """Obtiene estadísticas de las personas registradas"""
    total = db.query(KnownPerson).count()
    
    # Personas que han sido detectadas al menos una vez
    detected = db.query(KnownPerson).join(Detection).distinct().count()
    
    # Últimas personas registradas
    latest = db.query(KnownPerson).order_by(KnownPerson.registered_at.desc()).limit(5).all()
    
    return {
        "total": total,
        "detected": detected,
        "not_detected": total - detected,
        "latest": [
            {
                "id": p.id,
                "name": f"{p.name} {p.surname}",
                "registered_at": p.registered_at.isoformat()
            } for p in latest
        ]
    }

@router.get("/known_persons/{person_id}", response_model=KnownPersonRead)
def get_known_person(person_id: int, db: Session = Depends(get_db)):
    person = db.query(KnownPerson).filter(KnownPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.put("/known_persons/{person_id}")
def update_known_person(
    person_id: int,
    name: Optional[str] = None,
    surname: Optional[str] = None,
    metadata: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    person = db.query(KnownPerson).filter(KnownPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    if name:
        person.name = name
    if surname:
        person.surname = surname
    if metadata:
        person.person_metadata = metadata
    
    db.commit()
    db.refresh(person)
    return {"message": "Person updated successfully", "person": person}


@router.delete("/known_persons/{person_id}")
def delete_known_person(person_id: int, db: Session = Depends(get_db)):
    person = db.query(KnownPerson).filter(KnownPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    db.delete(person)
    db.commit()
    return {"message": "Person deleted successfully"}

@router.post("/detections", response_model=DetectionRead)
def create_detection(payload: DetectionCreate, db: Session = Depends(get_db)):
    known_persons = db.query(KnownPerson).all()
    matched_person = match_known_person(payload.vector, known_persons)

    detection = Detection(
        vector=payload.vector,
        recognized=matched_person is not None,
        known_person_id=matched_person.id if matched_person else None,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)
    return detection

@router.get("/detections", response_model=list[DetectionRead])
def list_detections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    recognized: Optional[bool] = None,
    person_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Detection)
    
    if recognized is not None:
        query = query.filter(Detection.recognized == recognized)
    
    if person_id is not None:
        query = query.filter(Detection.known_person_id == person_id)
    
    return query.order_by(Detection.first_moment.desc()).offset(skip).limit(limit).all()

@router.get("/detections/stats")
def get_detection_stats(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """
    Estadísticas de detecciones
    """
    from datetime import datetime, timedelta
    
    since_date = datetime.now() - timedelta(days=days)
    
    total_detections = db.query(Detection).filter(
        Detection.first_moment >= since_date
    ).count()
    
    recognized_detections = db.query(Detection).filter(
        Detection.first_moment >= since_date,
        Detection.recognized == True
    ).count()
    
    # Personas más detectadas
    top_persons = db.query(
        KnownPerson.name,
        KnownPerson.surname,
        func.count(Detection.id).label('detection_count')
    ).join(
        Detection, KnownPerson.id == Detection.known_person_id
    ).filter(
        Detection.first_moment >= since_date,
        Detection.recognized == True
    ).group_by(
        KnownPerson.id
    ).order_by(
        func.count(Detection.id).desc()
    ).limit(5).all()
    
    return {
        "total_detections": total_detections,
        "recognized_detections": recognized_detections,
        "unrecognized_detections": total_detections - recognized_detections,
        "recognition_rate": round((recognized_detections / total_detections * 100), 2) if total_detections > 0 else 0,
        "top_persons": [
            {
                "name": f"{p.name} {p.surname}",
                "detections": p.detection_count
            } for p in top_persons
        ],
        "days": days
    }