import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SessionTimer from "./study-session/SessionTimer";
import WebcamFeed from "./study-session/WebcamFeed";
import FocusNotifications from "./study-session/FocusNotifications";
import ChatInterface from "./study-session/ChatInterface";
import CenterStage from "./study-session/CenterStage";
import NotificationManager, { AppNotification } from "@/components/study-session/NotificationManager";
import useWebSocketNotifications from "@/hooks/useWebSocketNotifs";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function StudySession() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionDuration = location.state?.duration || 30; // in minutes
  const breakInterval = location.state?.breakInterval || 30; // in minutes
  const breakDuration = location.state?.breakDuration || 5; // in minutes

  // Is a video playing in the center stage
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  // List of active notifs in the sidebar
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: Date }>>([]);
  // Counts how many times user lost focus
  const [interruptionCount, setInterruptionCount] = useState(0);
  // Signal that triggers notif in center temporarily
  //const [notifSignal, setNotifSignal] = useState(false);
  
  // Notifications queue for CenterStage
  const incomingNotif = useWebSocketNotifications();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Open video in center stage
  const handleVideoRequest = (videoUrl: string) => {
    setCurrentVideo(videoUrl);
    setIsVideoPlaying(true);
  };

  // Close video and reset state
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
      {/* Left Sidebar - Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0 border-r border-purple-200 bg-white/80 backdrop-blur-sm">
          <ChatInterface onVideoRequest={handleVideoRequest} />
        </div>

        {/* Center Stage - Mascot or Video */}
        <div className="flex-1 flex items-center justify-center p-8">
          <NotificationManager incoming={incomingNotif}>
              {(current, close) => (
                <CenterStage
                  isVideoPlaying={!!currentVideo}
                  videoUrl={currentVideo}
                  onCloseVideo={handleCloseVideo}
                  notification={current}
                  onCloseNotification={close}
                />
              )}
            </NotificationManager>
        </div>

        {/* Right Sidebar - Timer, Webcam, Notifications */}
        <div className="w-80 flex-shrink-0 border-l border-purple-200 bg-white/80 backdrop-blur-sm flex flex-col">
          <SessionTimer 
            totalDuration={sessionDuration * 60}
            breakInterval={breakInterval * 60}
            breakDuration={breakDuration * 60}
            onSessionEnd={handleSessionEnd}
          />
          <WebcamFeed onFocusLost={handleFocusLost} />
          <FocusNotifications notifications={notifications} />
        </div>
      </div>
    </div>
  );
}