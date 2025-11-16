import { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WebcamFeedProps {
  onFocusLost: ({ phone, tired, fidgety }: { phone: boolean; tired: boolean; fidgety: boolean }) => void;
  sendFrame: (base64: string) => void;
  isFocused: boolean;
}

export default function WebcamFeed({ onFocusLost, sendFrame, isFocused }: WebcamFeedProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    requestWebcam();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const requestWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setStream(mediaStream);
      setHasPermission(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (e) {
      console.error("Error getting webcam:", e);
      setHasPermission(false);
    }
  };

  // Capture frames
  useEffect(() => {
    if (!hasPermission || !videoRef.current) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const width = video.videoWidth || 320;
      const height = video.videoHeight || 240;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const base64Image = dataUrl.split(",")[1];

      sendFrame(base64Image);
    }, 500);

    return () => clearInterval(interval);
  }, [hasPermission, sendFrame]);

  return (
    <Card className="m-4 p-4 bg-gradient-to-br from-blue-100 to-purple-100 border-blue-200 rounded-2xl shadow-lg flex-shrink-0">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-700">
            <Camera className="w-4 h-4" />
            <span className="text-sm font-semibold">Focus Monitor</span>
          </div>
          {isFocused ? (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          )}
        </div>

        {hasPermission === false && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-xs text-orange-700">
              Camera access denied. Focus detection disabled.
            </AlertDescription>
          </Alert>
        )}

        {hasPermission === true ? (
          <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!isFocused && (
              <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                <span className="text-white text-xs font-semibold bg-orange-500 px-3 py-1 rounded-full">
                  Distracted
                </span>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : hasPermission === null ? (
          <div className="aspect-video rounded-xl bg-gray-200 animate-pulse flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-gray-100 flex flex-col items-center justify-center space-y-2 p-4">
            <CameraOff className="w-8 h-8 text-gray-400" />
            <Button onClick={requestWebcam} size="sm" variant="outline" className="text-xs rounded-full">
              Enable Camera
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
