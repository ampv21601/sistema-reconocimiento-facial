from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator
import os

class Settings(BaseSettings):
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    # Database
    DB_USER: str = None
    DB_PASSWORD: str = None
    DB_NAME: str = None
    DB_HOST: str = None
    DB_PORT: int = 5432
    DATABASE_URL: Optional[str] = None
    
    # Backend
    BACKEND_PORT: int = 8000
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://frontend:5173"
    
    # Face Recognition
    FACE_RECOGNITION_THRESHOLD: float = 0.6

    def __init__(self, **values):
        super().__init__(**values)
        # Construir DATABASE_URL si no está definida
        if not self.DATABASE_URL:
            db_user = self.DB_USER or os.getenv("DB_USER")
            db_password = self.DB_PASSWORD or os.getenv("DB_PASSWORD")
            db_host = self.DB_HOST or os.getenv("DB_HOST", "db")
            db_port = self.DB_PORT or os.getenv("DB_PORT", "5432")
            db_name = self.DB_NAME or os.getenv("DB_NAME")
            
            self.DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    @field_validator("ALLOWED_ORIGINS")
    def parse_allowed_origins(cls, v: str) -> List[str]:
        return [origin.strip() for origin in v.split(",")] if v else []

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignorar variables extra en el .env


settings = Settings()