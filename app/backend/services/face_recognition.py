from typing import Iterable, Optional, List
import numpy as np
import face_recognition
import cv2
from app.backend.models.person import KnownPerson


def vector_distance(v1: List[float], v2: List[float]) -> float:
    """
    Calcula la distancia euclidiana entre dos vectores
    """
    a = np.asarray(v1, dtype=float)
    b = np.asarray(v2, dtype=float)
    return float(np.linalg.norm(a - b))


def match_known_person(
    vector: List[float], 
    known_persons: Iterable[KnownPerson], 
    threshold: float = 0.6
) -> Optional[KnownPerson]:
    """
    Encuentra la persona conocida más cercana según el vector facial
    """
    best_person = None
    best_distance = float("inf")

    for person in known_persons:
        distance = vector_distance(vector, person.vector)
        if distance < best_distance:
            best_distance = distance
            best_person = person

    if best_person is not None and best_distance <= threshold:
        return best_person

    return None


def extract_face_vector(image_bytes: bytes) -> Optional[List[float]]:
    """
    Extrae el vector facial de una imagen
    """
    try:
        # Convertir bytes a imagen
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
        
        # Convertir a RGB
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detectar rostros
        face_locations = face_recognition.face_locations(rgb_img)
        
        if not face_locations:
            return None
        
        # Extraer encoding del primer rostro
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        if not face_encodings:
            return None
        
        return face_encodings[0].tolist()
    
    except Exception as e:
        print(f"Error extracting face vector: {str(e)}")
        return None


def detect_faces_in_frame(frame: np.ndarray) -> tuple:
    """
    Detecta rostros en un frame de video
    Returns: (face_locations, face_encodings)
    """
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
    
    return face_locations, face_encodings