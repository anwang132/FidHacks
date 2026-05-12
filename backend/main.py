from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import parse_resume, chat_negotiation, invest_advice, market_data, job_search, col_estimate, tts, transcribe

load_dotenv()

app = FastAPI(title="Salary Coach API")

# Allow all origins in dev so any localhost port works
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse_resume.router, prefix="/api")
app.include_router(chat_negotiation.router, prefix="/api")
app.include_router(invest_advice.router, prefix="/api")
app.include_router(market_data.router, prefix="/api")
app.include_router(job_search.router, prefix="/api")
app.include_router(col_estimate.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(transcribe.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
