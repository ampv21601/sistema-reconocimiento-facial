from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class KnownPersonBase(BaseModel):
    name: str
    vector: List[float]
    person_person_metadata: Optional[dict] = None


class KnownPersonCreate(KnownPersonBase):
    pass


class KnownPersonRead(KnownPersonBase):
    id: int
    registered_at: datetime

    class Config:
        orm_mode = True


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
        orm_mode = True
