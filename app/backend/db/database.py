import os  # Permite acceder a variables de entorno del sistema
from sqlalchemy import create_engine  # Crea el motor de conexión a la base de datos
from sqlalchemy.orm import sessionmaker, declarative_base  # Gestión de sesiones y base ORM

from app.backend.core.config import settings  # Importa la configuración de la aplicación

# Obtiene la URL de conexión desde una variable de entorno
DATABASE_URL = settings.DATABASE_URL

# Valida que la variable de entorno esté definida
if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está definida")

# Crea el motor de conexión a la base de datos
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Comprueba conexiones antes de usarlas para evitar conexiones muertas
    pool_size=10         # Número máximo de conexiones simultáneas en el pool
)

# Crea una fábrica de sesiones para interactuar con la base de datos
SessionLocal = sessionmaker(
    bind=engine,        # Asocia el motor de conexión
    autocommit=False,   # Desactiva commits automáticos (control manual de transacciones)
    autoflush=False     # Evita sincronización automática con la BD antes de queries
)

# Clase base para definir modelos ORM (tablas)
Base = declarative_base()