from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import youtube_client
from app.services import gemini_client

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
@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Receive a user message, check if it's a music request using Gemini,
    then return appropriate response.
    """

    user_message = req.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Use Gemini to determine if this is a music request
    is_music, music_query = await gemini_client.is_music_request(user_message)
    
    if not is_music:
        # Not a music request - politely decline
        return ChatResponse(
            reply="I'm sorry, but I can only help you with playing study music right now. Try asking for music like 'play some lofi beats' or 'I need focus music'! 🎵",
            shouldPlayVideo=False,
            videoUrl=None,
        )
    
    # It's a music request - search for video
    query = music_query or user_message
    
    try:
        video_url = await youtube_client.search_best_video(music_query)
    except Exception as e:
        # log this in real life
        raise HTTPException(
            status_code=500,
            detail=f"Error while searching YouTube: {str(e)}"
        )

    if not video_url:
        # No video found
        return ChatResponse(
            reply="I couldn't find a suitable music video for that. Try being more specific, like 'lofi study beats' or 'classical piano music'! 😊",
            shouldPlayVideo=False,
            videoUrl=None,
        )

    # Found a video – tell the frontend to play it
    return ChatResponse(
        reply=f"Here's some great study music for you! 🎵✨",
        shouldPlayVideo=True,
        videoUrl=video_url,
    )
