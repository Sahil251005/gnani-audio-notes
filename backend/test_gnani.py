from sqlalchemy import select

from app.database import SessionLocal
from app.gnani import create_job, start_job
from app.models import AudioNote
from app.storage import generate_presigned_url

db = SessionLocal()

try:
    upload = db.scalars(
        select(AudioNote).order_by(AudioNote.created_at.desc())
    ).first()

    if not upload:
        raise RuntimeError("No uploaded audio found")

    if not upload.storage_key:
        raise RuntimeError("Upload has no storage key")

    audio_url = generate_presigned_url(upload.storage_key)

    created = create_job(audio_url)

    job_id = created["job_id"]

    upload.gnani_job_id = job_id
    upload.gnani_status = created["status"]
    db.commit()

    started = start_job(job_id)

    upload.gnani_status = started["status"]
    upload.status = "TRANSCRIBING"
    db.commit()

    print("Gnani job created:", job_id)
    print("Gnani status:", started["status"])

finally:
    db.close()