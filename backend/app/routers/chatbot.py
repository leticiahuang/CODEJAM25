from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import youtube_client

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
    Receive a user message, use it as a YouTube search query,
    and return the top video as `videoUrl`.
    """

    # (You don't *need* history yet, but we'll leave it in case you add LLMs later)
    # messages = req.history or []
    # messages.append({"role": "user", "content": req.message})

    # Use the user's message directly as the search query for now
    query = req.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        video_url = await youtube_client.search_best_video(query)
    except Exception as e:
        # log this in real life
        raise HTTPException(
            status_code=500,
            detail=f"Error while searching YouTube: {str(e)}"
        )

    if not video_url:
        # No video found – you still need to return a valid ChatResponse
        return ChatResponse(
            reply="I couldn't find a suitable video for that topic. Try rephrasing or being more specific? 😊",
            shouldPlayVideo=False,
            videoUrl=None,
        )

    # Found a video – tell the frontend to play it
    return ChatResponse(
        reply=f"Here's a video I found that should help with: “{query}” 🎥",
        shouldPlayVideo=True,
        videoUrl=video_url,
    )