import os

from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

celery = Celery(
    "gnani_audio_notes",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"],
)

celery.conf.update(
    # Retry connecting to Redis when worker starts.
    broker_connection_retry_on_startup=True,

    # Retry publishing a task if Redis is temporarily unavailable.
    task_publish_retry=True,
    task_publish_retry_policy={
        "max_retries": 3,
        "interval_start": 0,
        "interval_step": 1,
        "interval_max": 5,
    },

    # Acknowledge tasks only after they finish.
    # If a worker crashes during a task, Redis can redeliver it.
    task_acks_late=True,

    # Requeue a task when the worker process disappears unexpectedly.
    task_reject_on_worker_lost=True,

    # Prevent one worker from reserving many long-running tasks.
    worker_prefetch_multiplier=1,
)