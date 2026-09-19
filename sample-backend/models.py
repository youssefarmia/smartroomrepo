from sqlalchemy import Column, Integer, Float, Boolean, DateTime, String
from datetime import datetime
from database import Base

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature = Column(Float)
    humidity = Column(Float)
    light = Column(Integer)
    occupied = Column(Boolean)

class DeviceEvent(Base):
    __tablename__ = "device_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    device = Column(String)
    new_state = Column(Boolean)