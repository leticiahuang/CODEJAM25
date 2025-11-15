// src/components/WebcamFeed.tsx
import { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WebcamFeedProps {
  onFocusLost: () => void;
}

const WS_URL =
  import.meta.env.VITE_BACKEND_WS_URL ?? "ws://localhost:8000/ws/focus"; //sets 8000 as default,  but should use backend url

export default function WebcamFeed({ onFocusLost }: WebcamFeedProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  ///states/notifications:
  const [isFocused, setIsFocused] = useState(true); //isfocused: initially set to true, setisfocused can update the state

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); //Access the <canvas> element to draw graphics --> for notifs? 
  const wsRef = useRef<WebSocket | null>(null); //stores a websocket instance

  // Start webcam on mount
  useEffect(() => {
    requestWebcam();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(WS_URL); // connects to the url
    wsRef.current = ws;

    //onopen and onmessage (later) are event handler properties provided by the websocket api.
    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsWsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onmessage = (event) => { //onmessage: handler triggered whenever the WebSocket receives a message from the server. the event contains the data sent by the server. 
      //in this case, event = focus result boolean
      //type: focus result
      //boolean: isfocused
      try {
        const data = JSON.parse(event.data);

        if (data.type === "focus_result") {
          const focused = !!data.is_focused;

          if (!focused && isFocused) {
            // Just transitioned from focused -> not focused
            setIsFocused(false);
            onFocusLost();

            // Show "Distracted" for a few seconds, then go back to focused
            setTimeout(() => setIsFocused(true), 3000);
          }
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFocusLost, isFocused]);

  // Periodically capture frames & send via WebSocket
  useEffect(() => {
    // Only start if:
    // - we have permission
    // - the WS is connected
    // - we have a video element
    if (!hasPermission || !isWsConnected || !videoRef.current) return;

    const intervalMs = 500; // send ~2 frames/sec (adjust as you like)
    const intervalId = setInterval(() => {
      captureAndSendFrame();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [hasPermission, isWsConnected]);

  const requestWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
      });
      setStream(mediaStream);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error getting webcam:", error);
      setHasPermission(false);
    }
  };

  const captureAndSendFrame = async () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 320;
    const height = video.videoHeight || 240;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Get base64 JPEG
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    // dataUrl looks like "data:image/jpeg;base64,XXXX..."
    const base64Image = dataUrl.split(",")[1];

    const payload = {
      type: "frame",
      image: base64Image,
    };

    ws.send(JSON.stringify(payload));
  };

  return (
    <Card className="m-4 p-4 bg-gradient-to-br from-blue-100 to-purple-100 border-blue-200 rounded-2xl shadow-lg flex-shrink-0">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-700">
            <Camera className="w-4 h-4" />
            <span className="text-sm font-semibold">Focus Monitor</span>
          </div>
          {/* Focus indicator */}
          {isFocused ? (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Optional: show WS status somewhere */}
        <div className="text-xs text-blue-600">
          WebSocket: {isWsConnected ? "Connected" : "Disconnected"}
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {!isFocused && (
              <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                <span className="text-white text-xs font-semibold bg-orange-500 px-3 py-1 rounded-full">
                  Distracted
                </span>
              </div>
            )}

            {/* Hidden canvas for capturing frames */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : hasPermission === null ? (
          <div className="aspect-video rounded-xl bg-gray-200 animate-pulse flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-gray-100 flex flex-col items-center justify-center space-y-2 p-4">
            <CameraOff className="w-8 h-8 text-gray-400" />
            <Button
              onClick={requestWebcam}
              size="sm"
              variant="outline"
              className="text-xs rounded-full"
            >
              Enable Camera
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}