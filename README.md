# HerMoneyMoves

> AI-powered financial toolkit built for Gen-Z women to close the gender pay gap — one negotiation at a time.

Built at **FidHacks 2025**.

---

## What It Does

Women who don't negotiate their first salary lose an average of **$500,000** over their career. HerMoneyMoves gives every woman the tools to fight back:

| Tool | What it does |
|---|---|
| **Resume Fit Grader** | Upload a resume or paste a job posting — get a fit score, skill reframes, and salary ranges for matching roles |
| **Negotiation Simulator** | Practice with Jordan, an AI recruiter, across three escalating modes: guided choices → live text chat → voice negotiation |
| **Investment Simulator** | See how your salary compounds over 10 years with live market data, cost-of-living estimates, and a raise impact calculator |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Python 3.11+, FastAPI |
| AI | Google Gemini 2.0 Flash (chat, resume analysis, transcription), Gemini TTS |
| Market Data | Yahoo Finance (`yfinance`) |
| PDF Parsing | PyMuPDF |

---

## Project Structure

```
FidHacks/
├── backend/
│   ├── main.py                   # FastAPI app + CORS
│   └── routers/
│       ├── parse_resume.py       # Resume grading + job matching
│       ├── chat_negotiation.py   # Jordan AI recruiter chat
│       ├── invest_advice.py      # Personalized investment advice
│       ├── market_data.py        # Live ticker + S&P 500 data
│       ├── job_search.py         # Job search endpoint
│       ├── col_estimate.py       # AI cost-of-living estimator
│       ├── tts.py                # Gemini text-to-speech
│       └── transcribe.py        # Gemini audio transcription
└── frontend/
    ├── app/
    │   ├── page.tsx              # Home page
    │   ├── resume/               # Resume Grader page
    │   ├── negotiate/            # Negotiation Simulator pages
    │   │   ├── easy/             # Guided decision tree
    │   │   ├── medium/           # Live text chat
    │   │   └── hard/             # Voice negotiation
    │   └── invest/               # Investment Simulator page
    └── components/
        ├── ResumeGrader.tsx
        ├── InvestmentSimulator.tsx
        └── negotiation/
            ├── EasyMode.tsx
            ├── MediumMode.tsx
            ├── HardMode.tsx
            └── LockerRoom.tsx    # Inter-level transition screen
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Google AI Studio API key](https://aistudio.google.com/) (Gemini)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env and add your key
echo "GEMINI_API_KEY=your_key_here" > .env

uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The frontend expects the backend at `http://localhost:8000` by default.
> Override with `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

---

## Key Features

### Negotiation Simulator — Three Modes

- **Easy** — Multiple-choice decision tree with market context and coaching hints
- **Medium** — Free-text chat with Jordan, an AI recruiter who pushes back on weak asks
- **Hard** — Voice-to-voice negotiation using Gemini TTS + audio transcription; includes real-time speech coaching (confidence, filler words, hedging detection)

### Investment Simulator

- Live market tickers (SPY, QQQ, VTI) via Yahoo Finance
- AI cost-of-living estimator by city
- **Raise Impact Calculator** — drag a slider to see how a negotiated raise compounds over 10 years
- **Cost of Waiting** — interactive comparison of wealth destroyed by delaying investment 1–5 years
- **Milestone Tracker** — see when you hit $25k, $50k, $100k, $250k, $500k at your current rate
- Fixed 50/30/20 budget bar (all segments as % of net take-home)

### Resume Fit Grader

- PDF upload or paste job description
- Gemini-powered fit score, skill gap analysis, and salary range lookup
- Ranked list of matching roles with negotiation leverage points
