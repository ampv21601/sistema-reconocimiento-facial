from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.backend.database import engine

app = FastAPI()

# rutas frontend
PROJECT_ROOT = Path("/app")   # raíz real en Docker
FRONTEND = PROJECT_ROOT / "frontend"

# servir archivos estáticos
# app.mount("/static", StaticFiles(directory=FRONTEND), name="static")

# página principal
@app.get("/")
def home():
    return {"message": "Bienvenido a la API de reconocimiento facial. Use /persona.html para acceder a la página de personas."}
    # return FileResponse(FRONTEND / "index.html")

# página persona
@app.get("/persona.html")
def persona():
    return {"message": "Esta es la página de personas. Aquí se mostrarán las personas reconocidas."}
    # return FileResponse(FRONTEND / "persona.html")
