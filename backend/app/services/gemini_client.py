import os
import google.generativeai as genai
from typing import Optional

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

async def is_music_request(user_message: str) -> tuple[bool, Optional[str]]:
    """
    Use Gemini to determine if the user is requesting music.
    Returns (is_music_request: bool, music_query: str or None)
    """
    if not GEMINI_API_KEY:
        # Fallback: simple keyword matching
        music_keywords = ["music", "song", "play", "listen", "audio", "sound", "lofi", "beats", "jazz", "classical"]
        is_music = any(keyword in user_message.lower() for keyword in music_keywords)
        return is_music, user_message if is_music else None
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""Analyze this user message and determine if they are requesting music or audio to play while studying.

User message: "{user_message}"

Respond in this exact format:
IS_MUSIC: yes/no
QUERY: [if yes, extract/improve the search query for finding study music on YouTube, otherwise write "none"]

Examples:
- "play some lofi beats" -> IS_MUSIC: yes, QUERY: lofi beats study music
- "can you help me with math?" -> IS_MUSIC: no, QUERY: none
- "I need focus music" -> IS_MUSIC: yes, QUERY: focus study music
- "play jazz" -> IS_MUSIC: yes, QUERY: jazz study music
"""
        
        response = model.generate_content(prompt)
        result = response.text.strip()
        
        # Parse the response
        lines = result.split('\n')
        is_music = False
        query = None
        
        for line in lines:
            if line.startswith("IS_MUSIC:"):
                is_music = "yes" in line.lower()
            elif line.startswith("QUERY:"):
                query_text = line.split("QUERY:", 1)[1].strip()
                if query_text.lower() != "none":
                    query = query_text
        
        return is_music, query
        
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        # Fallback to keyword matching
        music_keywords = ["music", "song", "play", "listen", "audio", "sound", "lofi", "beats", "jazz", "classical"]
        is_music = any(keyword in user_message.lower() for keyword in music_keywords)
        return is_music, user_message if is_music else None
