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

def log_device_event(db, device, new_state, triggered_by="manual", reason=None):
    event = models.DeviceEvent(
        timestamp=datetime.utcnow(),
        device=device,
        new_state=new_state,
        triggered_by=triggered_by,
        reason=reason,
    )
    db.add(event)
    db.commit()

# Dependency: gives each request its own DB session, closes it after
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

sensor_state = {"temperature": 22.0, "humidity": 45.0, "light": 300, "occupied": True, "_previous_occupied" : True}
device_state = {"fan": False, "light": False}

class SensorReading(BaseModel):
    temperature: float
    humidity: float
    light: int
    occupied: bool

class DeviceState(BaseModel):
    device: str
    state: bool

import asyncio
import random

FAN_AUTO_THRESHOLD = 26
BASELINE_TEMP = 25

async def simulate_room():
    while True:
        await asyncio.sleep(2)

        prev_temp = sensor_state["temperature"]
        if device_state["fan"]:
            change = -0.3
        else:
            tempstabilizing = 0.05
            change = (BASELINE_TEMP - prev_temp) * tempstabilizing + (random.random() - 0.5) * 0.2
        sensor_state["temperature"] = max(18, min(28, prev_temp + change))

        prev_hum = sensor_state["humidity"]
        sensor_state["humidity"] = max(30, min(70, prev_hum + (random.random() - 0.5)))

        sensor_state["light"] = 800 if device_state["light"] else 300

        if random.random() < 0.05:
            sensor_state["occupied"] = not sensor_state["occupied"]

        db = SessionLocal()
        try:
            if sensor_state["temperature"] > FAN_AUTO_THRESHOLD and not device_state["fan"]:
                device_state["fan"] = True
                log_device_event(
                    db, "fan", True,
                    triggered_by="automation",
                    reason=f"Temperature reached {sensor_state['temperature']:.1f}°C",
                )

            just_became_unoccupied = sensor_state["_previous_occupied"] and not sensor_state["occupied"]
            if just_became_unoccupied and device_state["light"]:
                device_state["light"] = False
                log_device_event(
                    db, "light", False,
                    triggered_by="automation",
                    reason="Room became unoccupied",
                )

            sensor_state["_previous_occupied"] = sensor_state["occupied"]
        finally:
            db.close()


@app.on_event("startup")
async def start_simulation():
    asyncio.create_task(simulate_room())    

@app.get("/devices")
def get_devices():
    return device_state

@app.get("/events")
def get_events(limit: int = 20, db: Session = Depends(get_db)):
    events = (
        db.query(models.DeviceEvent)
        .order_by(models.DeviceEvent.timestamp.desc())
        .limit(limit)
        .all()
    )
    return events

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
def toggle_device(device: str, db: Session = Depends(get_db)):
    if device not in device_state:
        return {"error": f"Unknown device '{device}'"}

    device_state[device] = not device_state[device]
    log_device_event(db, device, device_state[device], triggered_by="manual")

    return {"device": device, "state": device_state[device]}