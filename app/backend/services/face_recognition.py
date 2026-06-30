from typing import Iterable, Optional, List, Tuple
import numpy as np
import face_recognition
import cv2
from app.backend.models.person import KnownPerson


def load_image_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
    """Decodifica bytes de imagen y retorna una imagen RGB."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def detect_faces(image: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """Detecta las ubicaciones de los rostros en una imagen RGB."""
    return face_recognition.face_locations(image)


def get_face_encodings(image: np.ndarray, face_locations=None) -> List[List[float]]:
    """Extrae las codificaciones faciales para las ubicaciones detectadas."""
    encodings = face_recognition.face_encodings(image, face_locations)
    return [encoding.tolist() for encoding in encodings]


def vector_distance(v1: List[float], v2: List[float]) -> float:
    """Calcula la distancia entre dos vectores faciales usando face_recognition."""
    a = np.asarray(v1, dtype=float)
    b = np.asarray(v2, dtype=float)
    distances = face_recognition.face_distance([a], b)
    return float(distances[0])


def match_known_person(
    vector: List[float],
    known_persons: Iterable[KnownPerson],
    threshold: float = 0.6
) -> Optional[KnownPerson]:
    """Encuentra la persona conocida más cercana según la distancia de face_recognition."""
    known_persons = list(known_persons)
    if not known_persons:
        return None

    known_vectors = [np.asarray(person.vector, dtype=float) for person in known_persons]
    distances = face_recognition.face_distance(known_vectors, np.asarray(vector, dtype=float))
    best_index = int(np.argmin(distances))
    best_distance = float(distances[best_index])

    if best_distance <= threshold:
        return known_persons[best_index]
    return None


def extract_face_vector(image_bytes: bytes) -> Optional[List[float]]:
    """Extrae el vector facial del primer rostro detectado en una imagen."""
    rgb_img = load_image_bytes(image_bytes)
    if rgb_img is None:
        return None

    face_locations = detect_faces(rgb_img)
    if not face_locations:
        return None

    face_encodings = get_face_encodings(rgb_img, face_locations)
    return face_encodings[0] if face_encodings else None


def detect_faces_in_frame(frame: np.ndarray) -> tuple:
    """Detecta rostros y calcula encodings para un frame de video."""
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_locations = detect_faces(rgb_frame)
    face_encodings = get_face_encodings(rgb_frame, face_locations)
    return face_locations, face_encodings