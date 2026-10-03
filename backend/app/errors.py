ERROR_MESSAGES = {
    "STORAGE_UPLOAD_FAILED":
        "The audio file could not be stored. Please try again.",

    "STORAGE_URL_FAILED":
        "The audio file could not be prepared for transcription.",

    "QUEUE_UNAVAILABLE":
        "Background processing is temporarily unavailable. Please try again.",

    "GNANI_AUTH_FAILED":
        "The transcription service could not be authenticated.",

    "GNANI_UNSUPPORTED_LANGUAGE":
        "The selected language is not supported for Batch transcription.",

    "GNANI_INVALID_CONFIG":
        "The transcription request configuration was rejected.",

    "GNANI_SOURCE_UNAVAILABLE":
        "The transcription service could not access the uploaded audio.",

    "GNANI_JOB_NOT_FOUND":
        "The transcription job could not be found.",

    "GNANI_START_FAILED":
        "The transcription job could not be started.",

    "GNANI_CANCELLED":
        "The transcription job was cancelled.",

    "GNANI_EMPTY_TRANSCRIPT":
        "No speech could be detected in the audio.",

    "GNANI_AUDIO_FAILED":
        "The audio could not be transcribed.",

    "GNANI_SERVICE_UNAVAILABLE":
        "The transcription service is temporarily unavailable.",

    "TRANSCRIPT_DOWNLOAD_FAILED":
        "The transcript could not be downloaded.",

    "LLM_FAILED":
        "The transcript is ready, but summary generation failed.",

    "INTERNAL_ERROR":
        "Processing failed unexpectedly.",

        "LLM_AUTH_FAILED":
    "The summary service could not be authenticated.",

"LLM_INVALID_REQUEST":
    "The summary request was rejected.",

"LLM_INVALID_RESPONSE":
    "The summary service returned an invalid response.",

"LLM_SERVICE_UNAVAILABLE":
    "The summary service is temporarily unavailable.",

"LLM_FAILED":
    "The transcript is ready, but summary generation failed.",
    
    "DATABASE_UNAVAILABLE":
    "The database is temporarily unavailable. Please try again.",
}



def get_error_message(error_code: str) -> str:
    return ERROR_MESSAGES.get(
        error_code,
        ERROR_MESSAGES["INTERNAL_ERROR"],
    )