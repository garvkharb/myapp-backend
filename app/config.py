from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/studymate"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    GROQ_API_KEY: str = ""
    
    FIREBASE_BUCKET: str = ""

    GOOGLE_CLIENT_ID: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
