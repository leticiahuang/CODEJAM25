# Study Buddy 🦉

Study Buddy is a study companion that helps you stay focused and understand your study habits. Using your webcam, it tracks focus, fatigue, and phone usage during study sessions, providing real-time feedback and post-session analytics. Customize your study and break intervals, and use the built-in chatbot to play background music, all without leaving your workspace!

## Features 🌟

### 1. Focus Tracking 🎯
- Real-time computer vision detects:
    - Distraction
    - Tiredness
    - Phone Usage
    - Fidgeting
- Instant notifications are displayed to guide you back on task

### 2. Custom Session Control ⏲
- Set your own study/break intervals (e.g. Pomodoro 25/5)
- Configure session duration
- Pause/resume anytime

### 3. Post-Session Analytics 📊
- After every session, receive a summary including:
    - Focus score
    - Distraction timeline
    - Breakdown of distraction types and counts of occurrences for each

### 4. Session History 📃
- Review past sessions to track productivity over time

### 4. Chatbot Assistant 🤖
- Plays a requested background video from Youtube using Google's Gemini AI

### 5. How we built it 🛠
- Frontend: React & Typescript
- Backend: Python, FastAPI, Uvicorn, WebSockets
- Computer Vision: OpenCV + MediaPipe
- Database & Auth: Supabase
- Background Music Integration: YouTube API & Gemini API

## Setup 🚀

### Prerequisites
```bash
python 3.11 
Node.js
Supabase account
```

### Installation
1. Clone the repository:
```bash
git clone [your-repo-url]
cd CODEJAM25
```

2. Create and activate virtual environment:
```bash
# For Mac/Linux
python -m venv .venv
source .venv/bin/activate  
# For Windows
python -m venv venv
source venv/Scripts/activate
```

3. Install dependencies:
```bash
# Backend
cd backend # from root
pip install -r requirements.txt
# Frontend
cd frontend # from root
npm install
```

4. Set up API keys:
Create a `.env` file in frontend and backend directories with:
```bash
# Frontend
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-key"
# Backend
YOUTUBE_API_KEY="your-youtube-api-key"
GEMINI_API_KEY="your-gemini-api-key"
```

### Running the Application
Open a split-terminal to run both the backend and frontend:
```bash
# Backend
cd backend # from root
python -m uvicorn app.main:app --port 8000
# Frontend
cd frontend # from root
npm run dev 
```
