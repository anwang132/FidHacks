.PHONY: install dev frontend backend

install:
	cd frontend && npm install
	cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt

dev:
	$(MAKE) -j2 frontend backend

frontend:
	cd frontend && npm run dev

backend:
	cd backend && .venv/bin/uvicorn main:app --reload --port 8000
