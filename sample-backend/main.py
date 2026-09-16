from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI()

# Allow your React frontend (running on a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default dev port
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory "state" (stand-in for a real database, coming Day 7) ---
sensor_state = {
    "temperature": 22.0,
    "humidity": 45.0,
    "light": 300,
    "occupied": True,
}

device_state = {
    "fan": False,
    "light": False,
}

# --- Pydantic models define the shape of data going in/out ---
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
def get_sensors():
    return sensor_state


@app.post("/devices/{device}/toggle", response_model=DeviceState)
def toggle_device(device: str):
    if device not in device_state:
        return {"error": f"Unknown device '{device}'"}
    device_state[device] = not device_state[device]
    return {"device": device, "state": device_state[device]}