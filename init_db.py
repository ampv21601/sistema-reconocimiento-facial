import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.backend.db.database import init_db, SessionLocal
from app.backend.models.person import KnownPerson
import numpy as np

def initialize_database():
    print("Inicializando base de datos...")
    init_db()
    print("Base de datos inicializada correctamente")
    
    # Opcional: Añadir algunas personas de ejemplo
    db = SessionLocal()
    try:
        # Verificar si ya hay datos
        if db.query(KnownPerson).count() == 0:
            print("Añadiendo datos de ejemplo...")
            # Aquí puedes añadir vectores de ejemplo
            # Nota: Los vectores reales vendrán de face_recognition
            pass
    finally:
        db.close()

if __name__ == "__main__":
    initialize_database()