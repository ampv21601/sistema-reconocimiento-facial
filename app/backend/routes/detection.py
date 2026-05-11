from datetime import datetime

import base64
import cv2
import numpy as np
import face_recognition
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.backend.core.config import settings
from app.backend.db.database import get_db
from app.backend.models.person import Detection, KnownPerson
from app.backend.services.face_recognition import vector_distance

router = APIRouter()


@router.post("/detect-frame")
async def detect_frame(image: str = Form(...), db: Session = Depends(get_db)):
    """Detecta personas en un frame de video"""
    try:
        if image.startswith("data:image"):
            image = image.split(",")[1]

        img_data = base64.b64decode(image)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)

        if not face_locations:
            return JSONResponse(content={
                "detected": False,
                "message": "No se detectaron rostros"
            })

        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        if not face_encodings:
            return JSONResponse(content={
                "detected": False,
                "message": "No se pudo extraer el vector facial"
            })

        vector = face_encodings[0].tolist()

        known_persons = db.query(KnownPerson).all()

        best_match = None
        best_distance = float("inf")

        for person in known_persons:
            distance = vector_distance(vector, person.vector)
            if distance < best_distance:
                best_distance = distance
                best_match = person

        threshold = settings.FACE_RECOGNITION_THRESHOLD
        recognized = best_match is not None and best_distance <= threshold

        detection = Detection(
            vector=vector,
            recognized=recognized,
            known_person_id=best_match.id if recognized else None
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)

        if recognized:
            return JSONResponse(content={
                "detected": True,
                "person_name": f"{best_match.name} {best_match.surname}",
                "confidence": round((1 - best_distance) * 100, 2),
                "person_id": best_match.id
            })

        return JSONResponse(content={
            "detected": True,
            "person_name": "Persona no registrada",
            "confidence": round((1 - best_distance) * 100, 2) if best_match else 0
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en detección: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-person")
async def add_person(
    name: str = Form(...),
    surname: str = Form(...),
    email: str = Form(None),
    role: str = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Añade una nueva persona al sistema"""
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)

        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in the image")

        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)

        if not face_encodings:
            raise HTTPException(status_code=400, detail="Could not extract face features")

        vector = face_encodings[0].tolist()

        existing = db.query(KnownPerson).filter(
            KnownPerson.name == name,
            KnownPerson.surname == surname
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Person already exists")

        person = KnownPerson(
            name=name,
            surname=surname,
            vector=vector,
            person_metadata={
                "email": email,
                "role": role,
                "registered_at": datetime.now().isoformat()
            }
        )
        db.add(person)
        db.commit()
        db.refresh(person)

        return JSONResponse(content={
            "success": True,
            "message": f"Persona {name} {surname} añadida correctamente",
            "person_id": person.id
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding person: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs")
def get_logs(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """Obtiene el historial de detecciones"""
    detections = db.query(Detection).order_by(
        Detection.first_moment.desc()
    ).offset(offset).limit(limit).all()

    logs = []
    for detection in detections:
        log_entry = {
            "id": detection.id,
            "timestamp": detection.first_moment.isoformat(),
            "status": "reconocido" if detection.recognized else "no reconocido",
            "confidence": None,
            "person_name": None
        }

        if detection.recognized and detection.known_person:
            log_entry["person_name"] = f"{detection.known_person.name} {detection.known_person.surname}"
            if detection.vector and detection.known_person.vector:
                distance = vector_distance(detection.vector, detection.known_person.vector)
                log_entry["confidence"] = round((1 - distance) * 100, 2)
        else:
            log_entry["person_name"] = "Persona no reconocida"
            log_entry["confidence"] = 0

        logs.append(log_entry)

    return JSONResponse(content={
        "logs": logs,
        "total": len(detections),
        "limit": limit,
        "offset": offset
    })
