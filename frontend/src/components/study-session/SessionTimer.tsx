import { useState, useEffect } from "react";
import { Clock, Pause, Play, Coffee, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionTimerProps {
  totalDuration: number; // in seconds
  breakInterval: number; // in seconds
  breakDuration: number; // in seconds
  onSessionEnd: (stats: { duration: number; breaks: number; completedFully: boolean }) => void;
}

export default function SessionTimer({ totalDuration, breakInterval, breakDuration, onSessionEnd }: SessionTimerProps) {
  // Calculate total time including all breaks
  const numBreaks = Math.floor(totalDuration / breakInterval);
  const totalTimeWithBreaks = totalDuration + (numBreaks * breakDuration);
  
  const [timeLeft, setTimeLeft] = useState(totalTimeWithBreaks);
  const [studyTimeLeft, setStudyTimeLeft] = useState(totalDuration); // actual study time remaining
  const [timeUntilBreak, setTimeUntilBreak] = useState(breakInterval);
  const [isRunning, setIsRunning] = useState(true);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(breakDuration);
  const [breaksCompleted, setBreaksCompleted] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        if (isOnBreak) {
          // On break - countdown break time and total time
          setBreakTimeLeft(prev => {
            if (prev <= 1) {
              // Break is over
              setIsOnBreak(false);
              setTimeUntilBreak(breakInterval); // Reset to configured interval
              setBreakTimeLeft(breakDuration); // Reset break time
              return breakDuration;
            }
            return prev - 1;
          });
          
          // Count down total time during break
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              onSessionEnd({
                duration: Math.round((totalDuration - studyTimeLeft) / 60),
                breaks: breaksCompleted,
                completedFully: true
              });
              return 0;
            }
            return prev - 1;
          });
        } else {
          // Not on break - countdown study time, total time, and time until break
          setStudyTimeLeft(prev => {
            if (prev <= 1) {
              // Study session complete
              clearInterval(interval);
              onSessionEnd({
                duration: Math.round(totalDuration / 60),
                breaks: breaksCompleted,
                completedFully: true
              });
              return 0;
            }
            return prev - 1;
          });
          
          setTimeLeft(prev => prev - 1);

          setTimeUntilBreak(prev => {
            if (prev <= 1) {
              // Time for a break
              setIsOnBreak(true);
              setBreaksCompleted(b => b + 1);
              return breakInterval;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isOnBreak, totalDuration, breaksCompleted, onSessionEnd, breakInterval, breakDuration]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    onSessionEnd({
      duration: Math.round((totalDuration - studyTimeLeft) / 60),
      breaks: breaksCompleted,
      completedFully: false
    });
  };

  return (
    <Card className="m-4 p-6 bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 rounded-2xl shadow-lg">
      <div className="flex flex-col space-y-4">
        {/* Break Badge */}
        {isOnBreak && (
          <Badge className="bg-green-500 text-white text-center py-2 rounded-full">
            <Coffee className="w-4 h-4 mr-2 inline" />
            Break Time!
          </Badge>
        )}

        {/* Time Left */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2 text-purple-700">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">Time Left</span>
          </div>
          <div className="text-4xl font-bold text-purple-900 font-mono tracking-tight">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Time Until Break / Break Time Left */}
        <div className="flex flex-col items-center space-y-2 pt-2 border-t border-purple-200">
          <div className="flex items-center space-x-2 text-pink-700">
            <Coffee className="w-4 h-4" />
            <span className="text-xs font-semibold">
              {isOnBreak ? "Break Time Left" : "Time Until Break"}
            </span>
          </div>
          <div className="text-2xl font-bold text-pink-900 font-mono">
            {formatTime(isOnBreak ? breakTimeLeft : timeUntilBreak)}
          </div>
        </div>

        {/* Breaks Counter */}
        <div className="bg-white/50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600">Breaks Completed</div>
          <div className="text-lg font-bold text-purple-900">{breaksCompleted}</div>
        </div>

        {/* Controls */}
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsRunning(!isRunning)}
            variant="outline"
            size="sm"
            className="flex-1 rounded-full bg-white hover:bg-purple-50 border-purple-300 text-purple-700"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button
            onClick={handleEndSession}
            variant="outline"
            size="sm"
            className="rounded-full bg-white hover:bg-red-50 border-red-300 text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}