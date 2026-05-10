from typing import Iterable, Optional
import numpy as np
from app.backend.models.person import KnownPerson


def vector_distance(v1: list[float], v2: list[float]) -> float:
    a = np.asarray(v1, dtype=float)
    b = np.asarray(v2, dtype=float)
    return float(np.linalg.norm(a - b))


def match_known_person(vector: list[float], known_persons: Iterable[KnownPerson], threshold: float = 0.65) -> Optional[KnownPerson]:
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
