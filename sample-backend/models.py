from sqlalchemy import Column, Integer, Float, Boolean, DateTime
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