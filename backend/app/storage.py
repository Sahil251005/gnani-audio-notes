import os
import uuid

import boto3
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
ENDPOINT_URL = os.getenv("R2_ENDPOINT")


class StorageUploadError(Exception):
    pass


class StorageURLGenerationError(Exception):
    pass


s3 = boto3.client(
    "s3",
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    region_name="auto",
)


def upload_audio(file, filename, content_type):
    try:
        extension = filename.rsplit(".", 1)[-1].lower()

        storage_key = f"audio/{uuid.uuid4()}.{extension}"

        s3.upload_fileobj(
            file,
            BUCKET_NAME,
            storage_key,
            ExtraArgs={
                "ContentType": content_type or "application/octet-stream"
            },
        )

        return storage_key

    except Exception as exc:
        raise StorageUploadError(
            "Audio upload to object storage failed"
        ) from exc


def generate_presigned_url(storage_key):
    try:
        return s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": storage_key,
            },
            ExpiresIn=3600,
        )

    except Exception as exc:
        raise StorageURLGenerationError(
            "Could not generate temporary audio URL"
        ) from exc