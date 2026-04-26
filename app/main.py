from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, notes, planner, progress, mocktest, chat
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="StudyMate API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/auth",     tags=["Auth"])
app.include_router(notes.router,    prefix="/notes",    tags=["Notes"])
app.include_router(planner.router,  prefix="/planner",  tags=["Planner"])
app.include_router(progress.router, prefix="/progress", tags=["Progress"])
app.include_router(mocktest.router, prefix="/mocktest", tags=["MockTest"])
app.include_router(chat.router,     prefix="/chat",     tags=["Chat"])

@app.get("/")
def root():
    return {"status": "StudyMate API running"}