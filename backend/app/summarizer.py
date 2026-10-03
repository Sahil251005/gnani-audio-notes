import os

import httpx
from dotenv import load_dotenv

class LLMInvalidResponseError(Exception):
    pass

load_dotenv()

API_KEY = os.getenv("LLM_API_KEY")
BASE_URL = os.getenv("LLM_BASE_URL")
MODEL = os.getenv("LLM_MODEL")

MAX_CHARS = 12000



def call_llm(text: str) -> str:
    response = httpx.post(
        f"{BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Summarize audio transcripts clearly and accurately. "
                        "Include the main topic, important points, decisions, "
                        "and action items when present. "
                        "Do not invent information."
                    ),
                },
                {
                    "role": "user",
                    "content": text,
                },
            ],
            "temperature": 0.2,
        },
        timeout=60,
    )

    response.raise_for_status()

    try:
        data = response.json()

        summary = (
            data["choices"][0]["message"]["content"]
        )

    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise LLMInvalidResponseError(
            "LLM response structure was invalid"
        ) from exc

    if not summary or not summary.strip():
        raise LLMInvalidResponseError(
            "LLM returned an empty summary"
        )

    return summary.strip()


def summarize_transcript(transcript: str) -> str:
    if len(transcript) <= MAX_CHARS:
        return call_llm(transcript)

    chunks = [
        transcript[i:i + MAX_CHARS]
        for i in range(0, len(transcript), MAX_CHARS)
    ]

    partial_summaries = []

    for chunk in chunks:
        partial_summaries.append(call_llm(chunk))

    combined = "\n\n".join(partial_summaries)

    return call_llm(
        "Combine these partial summaries into one clear final summary:\n\n"
        + combined
    )