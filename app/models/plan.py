from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, func
from app.database import Base

class StudyPlan(Base):
    __tablename__ = "study_plans"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    subjects     = Column(String)
    exam_date    = Column(String)
    hours_per_day= Column(Integer)
    plan_text    = Column(Text)
    created_at   = Column(DateTime, server_default=func.now())

class StudyTask(Base):
    __tablename__ = "study_tasks"
    id           = Column(Integer, primary_key=True, index=True)
    plan_id      = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    name         = Column(String, nullable=False)
    subject      = Column(String)
    duration_mins= Column(Integer, default=60)
    scheduled_date=Column(String)
    completed    = Column(Boolean, default=False)

class MockTestResult(Base):
    __tablename__ = "mock_test_results"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject    = Column(String)
    score      = Column(Integer)
    total      = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
