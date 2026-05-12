import os
import base64
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from google import genai
from google.genai import types

router = APIRouter()

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            return JSONResponse(status_code=400, content={"error": "No audio data.", "transcript": ""})

        audio_b64 = base64.b64encode(audio_bytes).decode()
        mime = audio.content_type or "audio/webm"

        client = get_client()
        resp = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(parts=[
                    types.Part(
                        inline_data=types.Blob(mime_type=mime, data=audio_b64)
                    ),
                    types.Part(
                        text=(
                            "Transcribe this audio recording verbatim. "
                            "Return ONLY the spoken words with no extra commentary, "
                            "labels, or punctuation beyond what was said. "
                            "If the audio is silent or unintelligible, return an empty string."
                        )
                    ),
                ])
            ],
        )

        transcript = (resp.text or "").strip()
        return JSONResponse(content={"transcript": transcript})

    except Exception as e:
        print(f"[transcribe] {type(e).__name__}: {e}")
        return JSONResponse(
            status_code=503,
            content={"error": "Transcription unavailable.", "transcript": ""},
        )
