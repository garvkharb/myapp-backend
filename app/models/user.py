from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True, index=True)
    google_id  = Column(String, unique=True, index=True, nullable=False)
    email      = Column(String, unique=True, index=True, nullable=False)
    name       = Column(String)
    picture    = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    streak     = Column(Integer, default=0)
    last_active= Column(DateTime, nullable=True)
