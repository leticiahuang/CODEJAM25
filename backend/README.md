to run backend:

1. cd to backend
2. python3.10 -m venv .venv
2. source .venv/bin/activate
3. pip install -r requirements.txt
4. python -m uvicorn app.main:app --reload --port 8000