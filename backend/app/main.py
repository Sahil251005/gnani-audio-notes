import os
import uuid

from dotenv import load_dotenv
import uuid

from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import get_error_message
from app.languages import SUPPORTED_LANGUAGES
from app.models import AudioNote
from app.storage import StorageUploadError, upload_audio
from app.tasks import submit_transcription

load_dotenv()

app = FastAPI(title="Gnani Audio Notes API")


# -------------------------------------------------
# CORS
# -------------------------------------------------

frontend_origin = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:3000",
)

allowed_origins = [
    "http://localhost:3000",
]

if frontend_origin not in allowed_origins:
    allowed_origins.append(frontend_origin)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "ok"}


# -------------------------------------------------
# SUPPORTED AUDIO EXTENSIONS
# -------------------------------------------------

ALLOWED_EXTENSIONS = {
    "mp3",
    "wav",
    "m4a",
    "aac",
    "ogg",
    "flac",
}


# -------------------------------------------------
# UPLOAD AUDIO
# -------------------------------------------------

@app.post("/uploads")
def create_upload(
    file: UploadFile = File(...),
    language_code: str = Form(...),
    db: Session = Depends(get_db),
):
    # Validate filename.
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="An audio file is required.",
        )

    # Validate extension exists.
    if "." not in file.filename:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file has no valid audio extension.",
        )

    extension = file.filename.rsplit(".", 1)[-1].lower()

    # Validate supported audio type.
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio file type.",
        )

    # Validate Gnani Batch language.
    if language_code not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported language for Gnani Batch STT.",
        )

    # Calculate file size.
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    # ---------------------------------------------
    # Store audio in R2
    # ---------------------------------------------

    try:
        storage_key = upload_audio(
            file.file,
            file.filename,
            file.content_type,
        )

    except StorageUploadError:
        raise HTTPException(
            status_code=503,
            detail=get_error_message(
                "STORAGE_UPLOAD_FAILED"
            ),
        )

    # ---------------------------------------------
    # Create PostgreSQL record
    # ---------------------------------------------

    audio_note = AudioNote(
        original_filename=file.filename,
        content_type=file.content_type,
        file_size_bytes=file_size,
        storage_key=storage_key,
        language_code=language_code,
        status="UPLOADED",
    )

    try:
        db.add(audio_note)
        db.commit()
        db.refresh(audio_note)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=503,
            detail=get_error_message(
                "DATABASE_UNAVAILABLE"
            ),
        )

    # ---------------------------------------------
    # Mark processing as queued
    # ---------------------------------------------

    try:
        audio_note.status = "QUEUED"
        db.commit()
        db.refresh(audio_note)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=503,
            detail=get_error_message(
                "DATABASE_UNAVAILABLE"
            ),
        )

    # ---------------------------------------------
    # Send work to Celery through Redis
    # ---------------------------------------------

    try:
        submit_transcription.delay(
            str(audio_note.id)
        )

    except Exception:
        audio_note.status = "FAILED"
        audio_note.error_code = "QUEUE_UNAVAILABLE"
        audio_note.error_message = get_error_message(
            "QUEUE_UNAVAILABLE"
        )

        try:
            db.commit()
        except SQLAlchemyError:
            db.rollback()

        raise HTTPException(
            status_code=503,
            detail=get_error_message(
                "QUEUE_UNAVAILABLE"
            ),
        )

    return {
        "id": str(audio_note.id),
        "filename": audio_note.original_filename,
        "language_code": audio_note.language_code,
        "status": audio_note.status,
    }


# -------------------------------------------------
# UPLOAD HISTORY
# -------------------------------------------------

@app.get("/uploads")
def get_uploads(
    db: Session = Depends(get_db),
):
    uploads = db.scalars(
        select(AudioNote)
        .order_by(AudioNote.created_at.desc())
    ).all()

    return [
        {
            "id": str(upload.id),
            "filename": upload.original_filename,
            "language_code": upload.language_code,
            "status": upload.status,
            "created_at": upload.created_at,
        }
        for upload in uploads
    ]


# -------------------------------------------------
# SINGLE UPLOAD DETAILS
# -------------------------------------------------

@app.get("/uploads/{upload_id}")
def get_upload(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    upload = db.get(
        AudioNote,
        upload_id,
    )

    if not upload:
        raise HTTPException(
            status_code=404,
            detail="Upload not found",
        )

    return {
        "id": str(upload.id),
        "filename": upload.original_filename,
        "language_code": upload.language_code,
        "status": upload.status,
        "transcript": upload.transcript,
        "summary": upload.summary,
        "error_code": upload.error_code,
        "error_message": upload.error_message,
        "created_at": upload.created_at,
        "completed_at": upload.completed_at,
    }


# -------------------------------------------------
# UPLOAD PROCESSING STATUS
# -------------------------------------------------

@app.get("/uploads/{upload_id}/status")
def get_upload_status(
    upload_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    upload = db.get(
        AudioNote,
        upload_id,
    )

    if not upload:
        raise HTTPException(
            status_code=404,
            detail="Upload not found",
        )

    return {
        "id": str(upload.id),
        "status": upload.status,
        "gnani_status": upload.gnani_status,
        "error_code": upload.error_code,
        "error_message": upload.error_message,
    }