from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path

from app.backend.core.config import settings
from app.backend.db.database import engine
from app.backend.routes.person import router as person_router

app = FastAPI(
    title="Choose Your Own Adventure Game API",
    description="api to generate cool stories",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(person_router)

# rutas frontend
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND = BASE_DIR / "frontend"

# servir archivos estáticos
# app.mount("/static", StaticFiles(directory=FRONTEND), name="static")

# página principal
@app.get("/")
def root():
    # return {"message": "Bienvenido a la API de reconocimiento facial. Use /persona.html para acceder a la página de personas."}
    return FileResponse(FRONTEND / "index.html")

# página persona
@app.get("/persona.html")
def persona():
    # return {"message": "Esta es la página de personas. Aquí se mostrarán las personas reconocidas."}
    return FileResponse(FRONTEND / "persona.html")
