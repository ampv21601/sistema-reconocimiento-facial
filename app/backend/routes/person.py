from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.backend.db.database import SessionLocal
from app.backend.models.person import Detection, KnownPerson
from app.backend.schemas.person import (
    DetectionCreate,
    DetectionRead,
    KnownPersonCreate,
    KnownPersonRead,
)
from app.backend.services.face_recognition import match_known_person

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/known_persons", response_model=KnownPersonRead)
def create_known_person(payload: KnownPersonCreate, db: Session = Depends(get_db)):
    existing = db.query(KnownPerson).filter(KnownPerson.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Known person already exists")

    person = KnownPerson(name=payload.name, vector=payload.vector, person_metadata=payload.person_metadata)
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.get("/known_persons", response_model=list[KnownPersonRead])
def list_known_persons(db: Session = Depends(get_db)):
    return db.query(KnownPerson).all()


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
def list_detections(db: Session = Depends(get_db)):
    return db.query(Detection).all()
