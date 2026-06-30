from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class KnownPersonBase(BaseModel):
    name: str
    surname: str
    vector: List[float]
    person_metadata: Optional[Dict[str, Any]] = None


class KnownPersonCreate(KnownPersonBase):
    pass


class KnownPersonUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    person_metadata: Optional[Dict[str, Any]] = None


class KnownPersonRead(KnownPersonBase):
    id: int
    registered_at: datetime

    class Config:
        from_attributes = True


class DetectionBase(BaseModel):
    vector: List[float]


class DetectionCreate(DetectionBase):
    pass


class DetectionRead(DetectionBase):
    id: int
    first_moment: datetime
    last_moment: Optional[datetime]
    recognized: bool
    known_person_id: Optional[int]
    known_person: Optional[KnownPersonRead] = None

    class Config:
        from_attributes = True