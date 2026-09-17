from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from database import engine, SessionLocal, Base
import models

Base.metadata.create_all(bind=engine)  # creates the table if it doesn't exist

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency: gives each request its own DB session, closes it after
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

sensor_state = {"temperature": 22.0, "humidity": 45.0, "light": 300, "occupied": True}
device_state = {"fan": False, "light": False}

class SensorReading(BaseModel):
    temperature: float
    humidity: float
    light: int
    occupied: bool

class DeviceState(BaseModel):
    device: str
    state: bool


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/sensors", response_model=SensorReading)
def get_sensors(db: Session = Depends(get_db)):
    # Save a snapshot of the current reading every time this is called
    reading = models.Reading(
        timestamp=datetime.utcnow(),
        temperature=sensor_state["temperature"],
        humidity=sensor_state["humidity"],
        light=sensor_state["light"],
        occupied=sensor_state["occupied"],
    )
    db.add(reading)
    db.commit()
    return sensor_state


@app.get("/history")
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    readings = (
        db.query(models.Reading)
        .order_by(models.Reading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return readings


@app.post("/devices/{device}/toggle", response_model=DeviceState)
def toggle_device(device: str):
    if device not in device_state:
        return {"error": f"Unknown device '{device}'"}
    device_state[device] = not device_state[device]
    return {"device": device, "state": device_state[device]}