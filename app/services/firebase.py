import firebase_admin
from firebase_admin import credentials, storage
import os, uuid

_initialized = False

def _init():
    global _initialized
    if not _initialized:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
        bucket    = os.getenv("FIREBASE_STORAGE_BUCKET", "")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {"storageBucket": bucket})
        _initialized = True

def upload_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Upload to Firebase Storage, return public URL."""
    _init()
    bucket  = storage.bucket()
    blob    = bucket.blob(f"notes/{uuid.uuid4()}_{filename}")
    blob.upload_from_string(file_bytes, content_type=content_type)
    blob.make_public()
    return blob.public_url

def delete_file(storage_url: str):
    _init()
    bucket = storage.bucket()
    # Extract blob path from URL
    path = storage_url.split(f"{bucket.name}/")[1].split("?")[0]
    bucket.blob(path).delete()
