import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SessionTimer from "./study-session/SessionTimer";
import WebcamFeed from "./study-session/WebcamFeed";
import FocusNotifications from "./study-session/FocusNotifications";
import ChatInterface from "./study-session/ChatInterface";
import CenterStage from "./study-session/CenterStage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function StudySession() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionDuration = location.state?.duration || 30; // in minutes
  
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: Date }>>([]);
  const [interruptionCount, setInterruptionCount] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  const handleVideoRequest = (videoUrl: string) => {
    setCurrentVideo(videoUrl);
    setIsVideoPlaying(true);
  };

  const handleCloseVideo = () => {
    setIsVideoPlaying(false);
    setCurrentVideo(null);
  };

  const handleFocusLost = ({ phone, tired, fidgety }) => {
    let message = ""
    
    if (phone) {
      message = "📱 Caught you on your phone — let's put it down and stay focused!";
    } else if (tired) {
      message = "😴 You look tired — maybe take a quick break or stretch!";
    } else if (fidgety) {
      message = "🌀 You seem fidgety — try readjusting your posture and refocusing!";
    }
  
    const newNotification = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
    };
  
    setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    setInterruptionCount(prev => prev + 1);
  };

  const handleSessionEnd = async (stats: { duration: number; breaks: number; completedFully: boolean }) => {
    // Calculate focus score based on interruptions and duration
    const focusScore = 10
    
    // Save session to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        const { data, error } = await supabase
          .from('study_session')
          .insert([{
            user_id: user.id,
            duration: stats.duration,
            focus_score: focusScore,
          }])
          .select();
        
        if (error) {
          console.error('Error saving session to Stats table:', error);
          alert(`Failed to save session: ${error.message}`);
        } else {
          console.log('Session saved successfully:', data);
        }
      } else {
        console.error('No user email found');
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
    
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
    <div className="h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white/80 backdrop-blur-sm border-b border-purple-200 flex items-center justify-between px-6">
        <Button
          onClick={handleBackToHome}
          variant="ghost"
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎓</span>
          </div>
          <h2 className="font-semibold text-gray-900">Study Session</h2>
        </div>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
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
    </div>
  );
}