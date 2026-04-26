import firebase_admin
from firebase_admin import credentials, storage
from app.config import settings
import uuid

# Initialize once
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase-service-account.json")
    firebase_admin.initialize_app(cred, {"storageBucket": settings.FIREBASE_BUCKET})

bucket = storage.bucket()


def upload_file(file_bytes: bytes, filename: str, content_type: str, user_id: int) -> str:
    """Upload a file to Firebase Storage and return a public URL."""
    unique_name = f"notes/{user_id}/{uuid.uuid4()}_{filename}"
    blob = bucket.blob(unique_name)
    blob.upload_from_string(file_bytes, content_type=content_type)
    blob.make_public()
    return blob.public_url


def delete_file(file_url: str) -> None:
    """Delete a file from Firebase Storage given its public URL."""
    try:
        # Extract blob path from URL
        path = file_url.split(f"{settings.FIREBASE_BUCKET}/")[1].split("?")[0]
        blob = bucket.blob(path)
        blob.delete()
    except Exception:
        pass  # Graceful failure if file doesn't exist
