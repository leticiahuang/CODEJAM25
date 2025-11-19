follow these instructions exactly to run backend:

1. cd to backend
2. python3.10 -m venv .venv (also works with python3.11)
3. source .venv/bin/activate (Mac)
3. source .venv/Scripts/activate (Windows)
4. pip install -r requirements.txt
5. python -m uvicorn app.main:app --reload --port 8000