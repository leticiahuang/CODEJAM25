import { useState } from "react";
import SessionTimer from "./study-session/SessionTimer";
import WebcamFeed from "./study-session/WebcamFeed";
import FocusNotifications from "./study-session/FocusNotifications";
import ChatInterface from "./study-session/ChatInterface";
import CenterStage from "./study-session/CenterStage";

export default function StudySession() {
  //VARIABLES to determine certain states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false); //VARIABLE isvideoplaying is defaulted to false. the function setisvideoplaying  can be used to update the value of isvideoplaying
  const [currentVideo, setCurrentVideo] = useState<string | null>(null); //NULL: when the component first loads, no video has been selected yet. STRING IS URL TO VIDEO PATH
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; timestamp: Date }>>([]); //when component first loads, theres no notifications. each time one gets created, add it to the array with a time and id

  const handleVideoRequest = (videoUrl: string) => {
    setCurrentVideo(videoUrl);
    setIsVideoPlaying(true);
  };

  const handleCloseVideo = () => {
    setIsVideoPlaying(false);
    setCurrentVideo(null);
  };

  //logic to create a new notification when focus is lost!!!!!!!!! 
  //right now the notification is hard coded
  const handleFocusLost = () => {
    const newNotification = { // creates a new notification object
      id: Date.now().toString(),
      message: "Hey there! Let's get back to studying 📚",
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 5)); //creates a new array by placing the newnotification at the beginning so new notification is at the top of the list
  };

  // now, here's the main layout of the page
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
        <SessionTimer />
        <WebcamFeed onFocusLost={handleFocusLost} />
        <FocusNotifications notifications={notifications} />
      </div>
    </div>
  );
}
