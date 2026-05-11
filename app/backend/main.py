from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.backend.core.config import settings
from app.backend.db.database import init_db, get_db
from app.backend.routes import person

# Inicializar base de datos al iniciar la aplicación
init_db()

app = FastAPI(
    title="Facial Recognition System",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(person.router, prefix=settings.API_PREFIX, tags=["persons"])

@app.get("/")
def root():
    return {
        "message": "Facial Recognition System API",
        "status": "running",
        "debug": settings.DEBUG,
        "api_prefix": settings.API_PREFIX
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Importar y añadir endpoints de detección
from fastapi import UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import base64
import cv2
import numpy as np
import face_recognition
from app.backend.services.face_recognition import vector_distance
from app.backend.models.person import KnownPerson, Detection
from sqlalchemy.orm import Session
from datetime import datetime

@app.post("/detect-frame")
async def detect_frame(image: str = Form(...)):
    """Detecta personas en un frame de video"""
    try:
        # Decodificar imagen
        if image.startswith('data:image'):
            image = image.split(',')[1]
        
        img_data = base64.b64decode(image)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Detectar rostros
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        
        if not face_locations:
            return JSONResponse(content={
                "detected": False,
                "message": "No se detectaron rostros"
            })
        
        # Extraer vector facial
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        if not face_encodings:
            return JSONResponse(content={
                "detected": False,
                "message": "No se pudo extraer el vector facial"
            })
        
        vector = face_encodings[0].tolist()
        
        # Buscar coincidencia en BD
        db = next(get_db())
        try:
            known_persons = db.query(KnownPerson).all()
            
            best_match = None
            best_distance = float("inf")
            
            for person in known_persons:
                distance = vector_distance(vector, person.vector)
                if distance < best_distance:
                    best_distance = distance
                    best_match = person
            
            # Guardar detección
            threshold = settings.FACE_RECOGNITION_THRESHOLD
            recognized = best_match is not None and best_distance <= threshold
            
            detection = Detection(
                vector=vector,
                recognized=recognized,
                known_person_id=best_match.id if recognized else None
            )
            db.add(detection)
            db.commit()
            
            if recognized:
                return JSONResponse(content={
                    "detected": True,
                    "person_name": f"{best_match.name} {best_match.surname}",
                    "confidence": round((1 - best_distance) * 100, 2),
                    "person_id": best_match.id
                })
            else:
                return JSONResponse(content={
                    "detected": True,
                    "person_name": "Persona no registrada",
                    "confidence": round((1 - best_distance) * 100, 2) if best_match else 0
                })
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error en detección: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/add-person")
async def add_person(
    name: str = Form(...),
    surname: str = Form(...),
    email: str = Form(None),
    role: str = Form(None),
    image: UploadFile = File(...)
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
        
        db = next(get_db())
        try:
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
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding person: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs")
async def get_logs(limit: int = 50, offset: int = 0):
    """Obtiene el historial de detecciones"""
    db = next(get_db())
    try:
        from app.backend.models.person import Detection, KnownPerson
        
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
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.BACKEND_PORT)