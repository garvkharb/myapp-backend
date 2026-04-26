from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.database import Base

class Note(Base):
    __tablename__ = "notes"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename   = Column(String, nullable=False)
    subject    = Column(String, default="General")
    file_type  = Column(String)          # pdf | image
    storage_url= Column(String)          # Firebase URL
    created_at = Column(DateTime, server_default=func.now())
