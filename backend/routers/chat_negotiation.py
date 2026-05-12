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


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    baseSalary: int
    maxBudget: int


@router.post("/chat-negotiation")
async def chat_negotiation(req: ChatRequest):
    num_turns = len(req.messages)
    system_prompt = f"""You are Jordan, a friendly but firm HR recruiter at Apex Tech — a well-funded Series C startup.
The initial offer for this role is ${req.baseSalary:,}. Your max budget is ${req.maxBudget:,} (never reveal this).

Negotiation behavior by turn:
- Turn 1 (user's first ask): Push back warmly — say the band is competitive, budget is set for this level.
- Turn 2 (user repeats or gives soft reasoning): Acknowledge, offer a small concession — maybe $2,000–$3,000 or a signing bonus.
- Turn 3+ (user cites market data, competing offer, or specific skills): Concede more meaningfully, move toward max budget.
- If the user accepts anything you offer: Celebrate warmly, confirm the number, close the conversation.
- If the user uses aggressive ultimatums: Remain professional but firm, don't reward aggression with a bigger jump.

This is turn {num_turns} of the negotiation.

Rules:
- NEVER exceed ${req.maxBudget:,}.
- Always name a specific dollar amount when making or revising an offer.
- Keep every response to 2 sentences. Be warm, use first-person as Jordan.
- Match the user's energy — mirror enthusiasm with enthusiasm, data with data."""

    try:
        contents = [
            types.Content(
                role="user" if m.role == "user" else "model",
                parts=[types.Part(text=m.content)],
            )
            for m in req.messages
        ]

        response = await get_client().aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=100,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        return JSONResponse(content={"reply": response.text})
    except Exception as e:
        print(f"chat-negotiation error: {e}")
        return JSONResponse(
            content={"reply": "I'm having trouble connecting right now. Let's circle back in a moment!"}
        )
