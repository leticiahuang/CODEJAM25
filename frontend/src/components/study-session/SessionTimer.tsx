import { useState, useEffect } from "react";
import { Clock, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SessionTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="m-4 p-6 bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 rounded-2xl shadow-lg">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-purple-700">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-semibold">Study Time</span>
        </div>
        
        <div className="text-5xl font-bold text-purple-900 font-mono tracking-tight">
          {formatTime(seconds)}
        </div>

        <Button
          onClick={() => setIsRunning(!isRunning)}
          variant="outline"
          size="sm"
          className="rounded-full bg-white hover:bg-purple-50 border-purple-300 text-purple-700"
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
      </div>
    </Card>
  );
}
