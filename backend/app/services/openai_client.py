import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(filename=".env", usecwd=True), override=True)

from typing import Optional
from openai import OpenAI

api_key = os.getenv("OPENAI_API_KEY")
model = "gpt-4o"

print(api_key)
print("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")

async def generate_ai_compliment(topic: Optional[str] = None) -> str:
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not configured.")
    
    client = OpenAI(api_key=api_key)
    prompt = f"Write a short, unique compliment about {topic or 'someone'}."

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a kind, witty compliment generator."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=40,
        temperature=0.9,
    )

    return resp.choices[0].message.content.strip()
