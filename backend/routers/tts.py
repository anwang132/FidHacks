import os
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from google import genai
from google.genai import types

router = APIRouter()

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


class TTSRequest(BaseModel):
    text: str
    voice: str = "Kore"  # warm, professional female voice


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    text = req.text.strip()[:600]
    if not text:
        return JSONResponse(status_code=400, content={"error": "Text is required."})
    try:
        client = get_client()
        resp = await client.aio.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=req.voice,
                        )
                    )
                ),
            ),
        )
        part = resp.candidates[0].content.parts[0]
        return JSONResponse(content={
            "audio": part.inline_data.data,       # base64-encoded PCM
            "mime": part.inline_data.mime_type,   # audio/L16;codec=pcm;rate=24000
        })
    except Exception as e:
        print(f"[tts] error: {type(e).__name__}: {e}")
        return JSONResponse(status_code=503, content={"error": "TTS unavailable — using browser voice."})
