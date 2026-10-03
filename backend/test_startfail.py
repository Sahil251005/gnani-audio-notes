from app.database import SessionLocal
from app.models import AudioNote
from app.tasks import submit_transcription


db = SessionLocal()

try:
    audio_note = AudioNote(
        original_filename="missing-test.mp3",
        content_type="audio/mpeg",
        file_size_bytes=100,
        storage_key="audio/this-file-does-not-exist.mp3",
        language_code="en-IN",
        status="QUEUED",
    )

    db.add(audio_note)
    db.commit()
    db.refresh(audio_note)

    print("Upload ID:", audio_note.id)

    submit_transcription.delay(
        str(audio_note.id)
    )

finally:
    db.close()