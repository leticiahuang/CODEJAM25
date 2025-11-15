from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chatbot

app = FastAPI(title="STUDY BUDDY API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot.router, prefix="/api", tags=["chatbot"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
