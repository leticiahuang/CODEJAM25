# services/youtube_client.py
import os
from typing import Optional
from dotenv import load_dotenv, find_dotenv
import httpx

load_dotenv()
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


async def search_best_video(query: str) -> Optional[str]:
    """
    Returns an embeddable YouTube URL for the 'best' video matching the query.
    If nothing is found, returns None.
    """
    if not YOUTUBE_API_KEY:
        raise RuntimeError("YOUTUBE_API_KEY environment variable is not set")

    base_url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 1,
        "videoEmbeddable": "true",
        # optional: "order": "viewCount"  # or "relevance" (default)
        "key": YOUTUBE_API_KEY,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.get(base_url, params=params)
        resp.raise_for_status()
        data = resp.json()

    items = data.get("items", [])
    if not items:
        return None

    video_id = items[0]["id"]["videoId"]
    # embeddable URL for <iframe src="...">
    return f"https://www.youtube.com/embed/{video_id}"
