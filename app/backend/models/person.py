from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.backend.db.database import Base


class Detection(Base):
    __tablename__ = "detection"

    id = Column(Integer, primary_key=True, index=True)
    first_moment = Column(DateTime(timezone=True), server_default=func.now())
    last_moment = Column(DateTime(timezone=True), onupdate=func.now())
    vector = Column(Vector(128), nullable=False)
    recognized = Column(Boolean, nullable=False, default=False)
    known_person_id = Column(Integer, ForeignKey("known_person.id"), nullable=True)

    known_person = relationship("KnownPerson", back_populates="detections")


class KnownPerson(Base):
    __tablename__ = "known_person"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    vector = Column(Vector(128), nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    person_metadata = Column(JSON, nullable=True)



    detections = relationship("Detection", back_populates="known_person")