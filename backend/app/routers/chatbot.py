from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.openai_client import generate_ai_compliment

router = APIRouter()

#pydantic verifiers: verify the types of info being sent to backend from frontend
class Message(BaseModel):
  role: str
  content: str

class ChatRequest(BaseModel):
  message: str
  history: list[Message] | None = None

class ChatResponse(BaseModel):
  reply: str
  shouldPlayVideo: bool = False
  videoUrl: str | None = None


# define the routers
@router.post("/chat", response_model=ChatResponse) #the user wants the server (backend) to create a new chat
async def chat(req: ChatRequest):
  # 1. Build conversation for model
  messages = req.history or []
  messages.append({"role": "user", "content": req.message})

  # 2. Call LLM
  completion = openai.ChatCompletion.create(
      model="gpt-4o-mini",  # or whatever
      messages=messages
  )

  reply_text = completion.choices[0].message["content"]

  # 3. Decide if we should search for a video
  should_play_video = "video" in req.message.lower() or "watch" in req.message.lower()
  video_url = None

  if should_play_video:
      # TODO: Use YouTube API or another search service.
      # For now, just a placeholder:
      video_url = "https://www.youtube.com/embed/dQw4w9WgXcQ"

  return ChatResponse(
      reply=reply_text,
      shouldPlayVideo=bool(video_url),
      videoUrl=video_url
  )