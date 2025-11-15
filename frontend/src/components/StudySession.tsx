import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SessionTimer from "./study-session/SessionTimer";
import WebcamFeed from "./study-session/WebcamFeed";
import FocusNotifications from "./study-session/FocusNotifications";
import ChatInterface from "./study-session/ChatInterface";
import CenterStage from "./study-session/CenterStage";

export default function StudySession() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionDuration = location.state?.duration || 30; // in minutes
  
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: Date }>>([]);
  const [interruptionCount, setInterruptionCount] = useState(0);

  const handleVideoRequest = (videoUrl: string) => {
    setCurrentVideo(videoUrl);
    setIsVideoPlaying(true);
  };

  const handleCloseVideo = () => {
    setIsVideoPlaying(false);
    setCurrentVideo(null);
  };

  const handleFocusLost = () => {
    const newNotification = {
      id: Date.now().toString(),
      message: "Hey there! Let's get back to studying 📚",
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    setInterruptionCount(prev => prev + 1);
  };

  const handleSessionEnd = (stats: { duration: number; breaks: number; completedFully: boolean }) => {
    // Calculate focus score based on interruptions and duration
    const maxInterruptions = Math.max(1, Math.floor(stats.duration / 10)); // Expected 1 per 10 min
    const focusScore = Math.max(0, Math.min(100, Math.round(100 - (interruptionCount / maxInterruptions) * 30)));
    
    navigate("/session-summary", {
      state: {
        stats: {
          duration: stats.duration,
          focusScore,
          breaks: stats.breaks,
          interruptions: interruptionCount,
          completedFully: stats.completedFully
        }
      }
    });
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex overflow-hidden">
      {/* Left Sidebar - Chat Interface */}
      <div className="w-80 flex-shrink-0 border-r border-purple-200 bg-white/80 backdrop-blur-sm">
        <ChatInterface onVideoRequest={handleVideoRequest} />
      </div>

      {/* Center Stage - Mascot or Video */}
      <div className="flex-1 flex items-center justify-center p-8">
        <CenterStage 
          isVideoPlaying={isVideoPlaying} 
          videoUrl={currentVideo}
          onCloseVideo={handleCloseVideo}
        />
      </div>

      {/* Right Sidebar - Timer, Webcam, Notifications */}
      <div className="w-80 flex-shrink-0 border-l border-purple-200 bg-white/80 backdrop-blur-sm flex flex-col">
        <SessionTimer 
          totalDuration={sessionDuration * 60} 
          onSessionEnd={handleSessionEnd}
        />
        <WebcamFeed onFocusLost={handleFocusLost} />
        <FocusNotifications notifications={notifications} />
      </div>
    </div>
  );
}