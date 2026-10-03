import os

import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("GNANI_BASE_URL")
API_KEY = os.getenv("GNANI_API_KEY")

HEADERS = {
    "X-API-Key-ID": API_KEY,
}


def create_job(
    audio_url: str,
    language_code: str,
):
    payload = {
        "config": {
            "model": "gnani-prisma-v2.5",
            "language_code": language_code,
            "mode": "transcribe",
            "with_diarization": False,
            "is_multi_channel": False,
            "with_denoise": False,
        },
        "source": {
            "type": "cloud_storage",
            "auth": {
                "mode": "public",
            },
            "paths": [audio_url],
        },
    }

    response = httpx.post(
        f"{BASE_URL}/stt/v3/batch/jobs",
        headers=HEADERS,
        json=payload,
        timeout=30,
    )

    response.raise_for_status()
    return response.json()


def start_job(job_id: str):
    response = httpx.post(
        f"{BASE_URL}/stt/v3/batch/jobs/{job_id}/start",
        headers=HEADERS,
        timeout=30,
    )

    response.raise_for_status()
    return response.json()


def get_job_status(job_id: str):
    response = httpx.get(
        f"{BASE_URL}/stt/v3/batch/jobs/{job_id}",
        headers=HEADERS,
        timeout=30,
    )

    response.raise_for_status()
    return response.json()


  # we permanently save that transcript in PostgreSQL because the Gnani URL is temporary
def get_job_files(job_id: str, status: str | None = None):
    params = {
        "limit": 100,
    }

    if status is not None:
        params["status"] = status

    response = httpx.get(
        f"{BASE_URL}/stt/v3/batch/jobs/{job_id}/files",
        headers=HEADERS,
        params=params,
        timeout=30,
    )

    response.raise_for_status()
    return response.json()


def download_transcript(transcript_url: str):
    response = httpx.get(
        transcript_url,
        timeout=30,
        follow_redirects=True,
    )

    response.raise_for_status()
    return response.json()