from concurrent.futures import ThreadPoolExecutor
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


def _recognize_face(face_location, rgb_frame, known_persons, threshold):
    """Reconoce un rostro concreto de forma independiente."""
    try:
        face_encodings = face_recognition.face_encodings(rgb_frame, [face_location])
    except Exception:
        return None

    if not face_encodings:
        return None

    vector = face_encodings[0].tolist()
    best_match = None
    best_distance = float("inf")

    for person in known_persons:
        distance = vector_distance(vector, person.vector)
        if distance < best_distance:
            best_distance = distance
            best_match = person

    recognized = best_match is not None and best_distance <= threshold
    return {
        "vector": vector,
        "recognized": recognized,
        "person_id": best_match.id if recognized else None,
        "person_name": f"{best_match.name} {best_match.surname}" if recognized else "Persona no registrada",
        "confidence": round((1 - best_distance) * 100, 2) if best_match else 0,
    }


def _get_next_user_name(db: Session) -> str:
    """Genera un nombre único del estilo Usuario N para los registros automáticos."""
    existing_users = db.query(KnownPerson).filter(KnownPerson.name.like("Usuario %")).all()
    numbers = []
    for person in existing_users:
        try:
            numbers.append(int(str(person.name).split()[-1]))
        except (ValueError, IndexError):
            continue
    next_number = max(numbers, default=0) + 1
    return f"Usuario {next_number}"

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

        known_persons = db.query(KnownPerson).all()
        threshold = settings.FACE_RECOGNITION_THRESHOLD

        detections_to_add = []
        results = []

        with ThreadPoolExecutor(max_workers=min(8, max(1, len(face_locations)))) as executor:
            futures = [
                executor.submit(_recognize_face, face_location, rgb_frame, known_persons, threshold)
                for face_location in face_locations
            ]
            for future in futures:
                result = future.result()
                if result is None:
                    continue

                if not result["recognized"]:
                    new_person = KnownPerson(
                        name=_get_next_user_name(db),
                        surname="",
                        vector=result["vector"],
                        person_metadata={
                            "registered_at": datetime.now().isoformat(),
                            "auto_registered": True,
                        }
                    )
                    db.add(new_person)
                    db.flush()
                    db.refresh(new_person)

                    result["recognized"] = True
                    result["person_id"] = new_person.id
                    result["person_name"] = new_person.name
                    result["confidence"] = 100
                    known_persons.append(new_person)

                results.append(result)
                detections_to_add.append(
                    Detection(
                        vector=result["vector"],
                        recognized=result["recognized"],
                        known_person_id=result["person_id"]
                    )
                )

        if detections_to_add:
            db.add_all(detections_to_add)
            db.commit()

        if not results:
            return JSONResponse(content={
                "detected": False,
                "message": "No se pudo extraer el vector facial"
            })

        primary_result = next((result for result in results if result["recognized"]), results[0])
        return JSONResponse(content={
            "detected": True,
            "detections": results,
            "person_name": primary_result["person_name"],
            "confidence": primary_result["confidence"],
            "person_id": primary_result["person_id"],
            "recognized": primary_result["recognized"],
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
