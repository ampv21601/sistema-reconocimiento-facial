from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.backend.core.config import settings
from app.backend.db.database import init_db
from app.backend.routes.detection import router as detection_router
from app.backend.routes.person import router as person_router


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
app.include_router(person_router, prefix=settings.API_PREFIX, tags=["persons"])
app.include_router(detection_router, prefix=settings.API_PREFIX, tags=["detections"])

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.BACKEND_PORT)