import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy.exc import OperationalError

from app.celery_app import celery
from app.database import SessionLocal
from app.errors import get_error_message
from app.gnani import (
    create_job,
    download_transcript,
    get_job_files,
    get_job_status,
    start_job,
)
from app.models import AudioNote
from app.storage import (
    StorageURLGenerationError,
    generate_presigned_url,
)
from app.summarizer import (
    LLMInvalidResponseError,
    summarize_transcript,
)


RETRYABLE_HTTP_CODES = {
    429,
    500,
    502,
    503,
    504,
}


class TranscriptUnavailableError(Exception):
    pass


# -------------------------------------------------
# HELPERS
# -------------------------------------------------

def mark_failed(
    db,
    upload,
    error_code,
    message=None,
    gnani_status=None,
):
    upload.status = "FAILED"
    upload.error_code = error_code
    upload.error_message = (
        message or get_error_message(error_code)
    )
    upload.completed_at = datetime.now(timezone.utc)

    if gnani_status:
        upload.gnani_status = gnani_status

    db.commit()


def get_completed_file(files_result):
    return next(
        (
            item
            for item in files_result.get("data", [])
            if item.get("status") == "COMPLETED"
            and item.get("transcript_url")
        ),
        None,
    )


def classify_gnani_file_error(
    raw_error: str | None,
) -> str:
    """
    Convert Gnani's per-file error message into
    a stable application error code.
    """

    if not raw_error:
        return "GNANI_AUDIO_FAILED"

    message = raw_error.lower()

    # Silent / non-speech audio.
    silence_indicators = {
        "empty transcript",
        "no speech",
        "no speech detected",
        "speech not detected",
        "silence",
        "silent audio",
        "non-speech",
        "no valid speech",
    }

    if any(
        indicator in message
        for indicator in silence_indicators
    ):
        return "GNANI_EMPTY_TRANSCRIPT"

    # Gnani could not access/download our source audio.
    source_indicators = {
        "invalid url",
        "invalid path",
        "unreachable",
        "unable to download",
        "could not download",
        "failed to download",
        "access denied",
        "forbidden",
    }

    if any(
        indicator in message
        for indicator in source_indicators
    ):
        return "GNANI_SOURCE_UNAVAILABLE"

    # Corrupt/unsupported/other processing failure.
    return "GNANI_AUDIO_FAILED"


def download_transcript_safely(
    job_id,
    transcript_url,
):
    try:
        return download_transcript(
            transcript_url
        )

    except httpx.HTTPStatusError as exc:
        # Gnani transcript URLs are temporary.
        # 403/404 may mean the URL expired.
        if exc.response.status_code not in {
            403,
            404,
        }:
            raise

    # Ask Gnani for a fresh transcript URL.
    files_result = get_job_files(job_id)

    completed_file = get_completed_file(
        files_result
    )

    if not completed_file:
        raise TranscriptUnavailableError(
            "No fresh transcript URL was returned"
        )

    try:
        return download_transcript(
            completed_file["transcript_url"]
        )

    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in {
            403,
            404,
        }:
            raise TranscriptUnavailableError(
                "Fresh transcript URL could not be downloaded"
            ) from exc

        raise


# -------------------------------------------------
# 1. CREATE + START GNANI JOB
# -------------------------------------------------

@celery.task(bind=True, max_retries=5)
def submit_transcription(
    self,
    upload_id: str,
):
    db = SessionLocal()
    upload = None

    try:
        upload = db.get(
            AudioNote,
            uuid.UUID(upload_id),
        )

        if not upload:
            return

        if not upload.storage_key:
            mark_failed(
                db,
                upload,
                "STORAGE_URL_FAILED",
            )
            return

        # -----------------------------------------
        # CREATE GNANI JOB
        # -----------------------------------------

        # Never create another Gnani job if
        # we already persisted a job ID.
        if not upload.gnani_job_id:
            try:
                audio_url = generate_presigned_url(
                    upload.storage_key
                )

            except StorageURLGenerationError:
                mark_failed(
                    db,
                    upload,
                    "STORAGE_URL_FAILED",
                )
                return

            created = create_job(
                audio_url,
                upload.language_code,
            )

            # Save job ID BEFORE Start.
            upload.gnani_job_id = created["job_id"]
            upload.gnani_status = created.get(
                "status"
            )
            upload.status = "TRANSCRIBING"
            upload.error_code = None
            upload.error_message = None

            db.commit()

        # -----------------------------------------
        # START GNANI JOB
        # -----------------------------------------

        if upload.gnani_status == "CREATED":
            try:
                started = start_job(
                    upload.gnani_job_id
                )

                upload.gnani_status = started.get(
                    "status"
                )
                upload.status = "TRANSCRIBING"
                upload.error_code = None
                upload.error_message = None

                db.commit()

            except httpx.HTTPStatusError as exc:
                # 409 = job already started or terminal.
                # Do NOT create another job.
                if exc.response.status_code == 409:
                    check_transcription.apply_async(
                        args=[upload_id],
                        countdown=10,
                    )
                    return

                raise

        # Poll after documented interval.
        check_transcription.apply_async(
            args=[upload_id],
            countdown=10,
        )

    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code

        # Temporary Gnani/API failures.
        if (
            status_code in RETRYABLE_HTTP_CODES
            and self.request.retries
            < self.max_retries
        ):
            raise self.retry(
                exc=exc,
                countdown=30,
            )

        if status_code in {401, 403}:
            error_code = "GNANI_AUTH_FAILED"

        elif status_code == 404:
            error_code = "GNANI_JOB_NOT_FOUND"

        elif status_code in {400, 422}:
            try:
                response_data = exc.response.json()
            except Exception:
                response_data = {}

            if (
                response_data.get("error")
                == "UNSUPPORTED_LANGUAGE"
            ):
                error_code = (
                    "GNANI_UNSUPPORTED_LANGUAGE"
                )
            else:
                error_code = "GNANI_INVALID_CONFIG"

        elif status_code in RETRYABLE_HTTP_CODES:
            error_code = (
                "GNANI_SERVICE_UNAVAILABLE"
            )

        else:
            error_code = "GNANI_START_FAILED"

        if upload:
            mark_failed(
                db,
                upload,
                error_code,
            )

    except httpx.RequestError as exc:
        # Timeout / network failure.
        if (
            self.request.retries
            < self.max_retries
        ):
            raise self.retry(
                exc=exc,
                countdown=30,
            )

        if upload:
            mark_failed(
                db,
                upload,
                "GNANI_SERVICE_UNAVAILABLE",
            )

    except OperationalError as exc:
        # Temporary PostgreSQL problem.
        raise self.retry(
            exc=exc,
            countdown=30,
        )

    except Exception:
        if upload:
            mark_failed(
                db,
                upload,
                "INTERNAL_ERROR",
            )

    finally:
        db.close()


# -------------------------------------------------
# 2. POLL GNANI + FETCH TRANSCRIPT
# -------------------------------------------------

@celery.task(bind=True, max_retries=5)
def check_transcription(
    self,
    upload_id: str,
):
    db = SessionLocal()
    upload = None

    try:
        upload = db.get(
            AudioNote,
            uuid.UUID(upload_id),
        )

        if not upload:
            return

        if not upload.gnani_job_id:
            mark_failed(
                db,
                upload,
                "GNANI_JOB_NOT_FOUND",
            )
            return

        result = get_job_status(
            upload.gnani_job_id
        )

        gnani_status = result["status"]

        upload.gnani_status = gnani_status
        db.commit()

        # -----------------------------------------
        # STILL PROCESSING
        # -----------------------------------------

        if gnani_status in {
            "CREATED",
            "STARTING",
            "QUEUED",
            "IN_PROGRESS",
        }:
            upload.status = "TRANSCRIBING"
            db.commit()

            check_transcription.apply_async(
                args=[upload_id],
                countdown=10,
            )
            return

        # -----------------------------------------
        # START FAILED
        # -----------------------------------------

        if gnani_status == "START_FAILED":
            mark_failed(
                db,
                upload,
                "GNANI_SOURCE_UNAVAILABLE",
                gnani_status=gnani_status,
            )
            return

        # -----------------------------------------
        # CANCELLED
        # -----------------------------------------

        if gnani_status == "CANCELLED":
            mark_failed(
                db,
                upload,
                "GNANI_CANCELLED",
                gnani_status=gnani_status,
            )
            return

        # -----------------------------------------
        # PROCESSING FAILED
        # -----------------------------------------

        if gnani_status == "FAILED":
            files_result = get_job_files(
                upload.gnani_job_id
            )

            raw_error = next(
                (
                    item.get("error_message")
                    for item
                    in files_result.get(
                        "data",
                        [],
                    )
                    if item.get(
                        "error_message"
                    )
                ),
                None,
            )

            # Handles silence, inaccessible source,
            # corrupt audio and generic failures.
            error_code = (
                classify_gnani_file_error(
                    raw_error
                )
            )

            mark_failed(
                db,
                upload,
                error_code,
                gnani_status=gnani_status,
            )
            return

        # -----------------------------------------
        # COMPLETED / PARTIAL FAILURE
        # -----------------------------------------

        if gnani_status in {
            "COMPLETED",
            "PARTIAL_FAILURE",
        }:
            files_result = get_job_files(
                upload.gnani_job_id
            )

            completed_file = get_completed_file(
                files_result
            )

            # No successful file returned.
            if not completed_file:
                raw_error = next(
                    (
                        item.get(
                            "error_message"
                        )
                        for item
                        in files_result.get(
                            "data",
                            [],
                        )
                        if item.get(
                            "error_message"
                        )
                    ),
                    None,
                )

                error_code = (
                    classify_gnani_file_error(
                        raw_error
                    )
                )

                mark_failed(
                    db,
                    upload,
                    error_code,
                    gnani_status=gnani_status,
                )
                return

            # -------------------------------------
            # DOWNLOAD TRANSCRIPT
            # -------------------------------------

            transcript_data = (
                download_transcript_safely(
                    upload.gnani_job_id,
                    completed_file[
                        "transcript_url"
                    ],
                )
            )

            transcript = transcript_data.get(
                "full_transcript"
            )

            # Gnani completed file but transcript
            # itself contains no speech.
            if (
                not transcript
                or not transcript.strip()
            ):
                mark_failed(
                    db,
                    upload,
                    "GNANI_EMPTY_TRANSCRIPT",
                    gnani_status=gnani_status,
                )
                return

            # IMPORTANT:
            # persist transcript BEFORE calling LLM.
            upload.transcript = transcript
            upload.status = "SUMMARIZING"
            upload.error_code = None
            upload.error_message = None

            db.commit()

            generate_summary.delay(
                upload_id
            )
            return

    except TranscriptUnavailableError:
        if upload:
            mark_failed(
                db,
                upload,
                "TRANSCRIPT_DOWNLOAD_FAILED",
            )

    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code

        if (
            status_code in RETRYABLE_HTTP_CODES
            and self.request.retries
            < self.max_retries
        ):
            raise self.retry(
                exc=exc,
                countdown=30,
            )

        if upload:
            if status_code in {401, 403}:
                error_code = (
                    "GNANI_AUTH_FAILED"
                )

            elif status_code == 404:
                error_code = (
                    "GNANI_JOB_NOT_FOUND"
                )

            elif (
                status_code
                in RETRYABLE_HTTP_CODES
            ):
                error_code = (
                    "GNANI_SERVICE_UNAVAILABLE"
                )

            else:
                error_code = (
                    "GNANI_AUDIO_FAILED"
                )

            mark_failed(
                db,
                upload,
                error_code,
            )

    except httpx.RequestError as exc:
        if (
            self.request.retries
            < self.max_retries
        ):
            raise self.retry(
                exc=exc,
                countdown=30,
            )

        if upload:
            mark_failed(
                db,
                upload,
                "GNANI_SERVICE_UNAVAILABLE",
            )

    except OperationalError as exc:
        raise self.retry(
            exc=exc,
            countdown=30,
        )

    except Exception:
        if upload:
            mark_failed(
                db,
                upload,
                "INTERNAL_ERROR",
            )

    finally:
        db.close()


# -------------------------------------------------
# 3. GENERATE LLM SUMMARY
# -------------------------------------------------

@celery.task(bind=True, max_retries=3)
def generate_summary(
    self,
    upload_id: str,
):
    db = SessionLocal()
    upload = None

    try:
        upload = db.get(
            AudioNote,
            uuid.UUID(upload_id),
        )

        if not upload:
            return

        # Transcript must have succeeded first.
        if not upload.transcript:
            mark_failed(
                db,
                upload,
                "LLM_FAILED",
                message="Transcript is missing.",
            )
            return

        upload.status = "SUMMARIZING"
        upload.error_code = None
        upload.error_message = None

        db.commit()

        summary = summarize_transcript(
            upload.transcript
        )

        # Successful end state.
        upload.summary = summary
        upload.status = "COMPLETED"
        upload.error_code = None
        upload.error_message = None
        upload.completed_at = datetime.now(
            timezone.utc
        )

        db.commit()

    except LLMInvalidResponseError:
        if upload:
            mark_failed(
                db,
                upload,
                "LLM_INVALID_RESPONSE",
            )

    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code

        # Temporary LLM failure.
        if (
            status_code in RETRYABLE_HTTP_CODES
            and self.request.retries
            < self.max_retries
        ):
            raise self.retry(
                exc=exc,
                countdown=30,
            )

        if status_code in {401, 403}:
            error_code = "LLM_AUTH_FAILED"

        elif status_code in {400, 422}:
            error_code = "LLM_INVALID_REQUEST"

        elif status_code in RETRYABLE_HTTP_CODES:
            error_code = (
                "LLM_SERVICE_UNAVAILABLE"
            )

        else:
            error_code = "LLM_FAILED"

        if upload:
            mark_failed(
                db,
                upload,
                error_code,
            )

    except httpx.RequestError as exc:
        # Timeout / temporary network issue.
        if (
            self.request.retries
            < self.max_retries
        ):
            raise self.retry(
                exc=exc,
                countdown=30,
            )

        if upload:
            mark_failed(
                db,
                upload,
                "LLM_SERVICE_UNAVAILABLE",
            )

    except OperationalError as exc:
        raise self.retry(
            exc=exc,
            countdown=30,
        )

    except Exception:
        if upload:
            mark_failed(
                db,
                upload,
                "LLM_FAILED",
            )

    finally:
        db.close()