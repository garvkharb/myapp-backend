from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    google_id     = Column(String(255), unique=True, index=True)
    email         = Column(String(255), unique=True, index=True)
    name          = Column(String(255))
    avatar_url    = Column(String(500), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    hashed_password = Column(String(255), nullable=True)
    subjects      = Column(JSON, nullable=True)
    
    notes         = relationship("Note",        back_populates="owner")
    plans         = relationship("StudyPlan",   back_populates="owner")
    tests         = relationship("MockTest",    back_populates="owner")
    messages      = relationship("ChatMessage", back_populates="owner")


class Note(Base):
    __tablename__ = "notes"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    title       = Column(String(255))
    subject     = Column(String(255))
    file_url    = Column(String(500))
    file_type   = Column(String(50))
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner       = relationship("User", back_populates="notes")


class StudyPlan(Base):
    __tablename__ = "study_plans"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    subjects    = Column(JSON)
    exam_date   = Column(String(50))
    daily_hours = Column(Float)
    plan_data   = Column(JSON)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner       = relationship("User",     back_populates="plans")
    progress    = relationship("Progress", back_populates="plan", uselist=False)


class Progress(Base):
    __tablename__ = "progress"
    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"))
    plan_id         = Column(Integer, ForeignKey("study_plans.id"))
    completed_tasks = Column(JSON)
    streak_days     = Column(Integer, default=0)
    last_active     = Column(DateTime(timezone=True), nullable=True)
    total_hours     = Column(Float, default=0.0)
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    plan            = relationship("StudyPlan", back_populates="progress")


class MockTest(Base):
    __tablename__ = "mock_tests"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    title       = Column(String(255))
    subject     = Column(String(255))
    questions   = Column(JSON)
    score       = Column(Float, nullable=True)
    completed   = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner       = relationship("User", back_populates="tests")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    role        = Column(String(50))
    content     = Column(Text)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner       = relationship("User", back_populates="messages")