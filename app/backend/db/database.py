from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.backend.core.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    """Inicializa la base de datos y crea las tablas"""
    try:
        # Habilitar la extensión pgvector
        with engine.connect() as conn:
            # Crear extensión si no existe
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            print("✅ Extensión pgvector habilitada")
        
        # Importar modelos aquí para evitar imports circulares
        from app.backend.models import person
        
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas correctamente")
        
    except Exception as e:
        print(f"❌ Error inicializando la base de datos: {str(e)}")
        raise

def get_db():
    """Dependencia para obtener una sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()