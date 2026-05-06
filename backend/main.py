from fastapi import FastAPI
from database import Base, engine

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def get_users():
    return {"status": "ok"}