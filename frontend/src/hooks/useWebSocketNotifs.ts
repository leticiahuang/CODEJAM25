import { useEffect, useState, useRef, useCallback } from "react";
import { AppNotification } from "@/components/study-session/NotificationManager";

export default function useWebSocketNotifs(
  onFocusLost: (data: { phone: boolean; tired: boolean; fidgety: boolean }) => void
) {
  const [incoming, setIncoming] = useState<AppNotification | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Focused state logic
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/focus");
    wsRef.current = ws;

    ws.onopen = () => console.log("WS CONNECTED");
    ws.onclose = () => console.log("WS CLOSED");
    ws.onerror = (err) => console.error("WS ERROR:", err);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "focus_result") return;

        const phone = !!data.phone;
        const tired = !!data.tired;
        const fidgety = !!data.fidgety;
        const distracted = phone || tired || fidgety;

        if (distracted && isFocused) {
          setIsFocused(false);
          onFocusLost({ phone, tired, fidgety });
          // Back to focused after 3s
          setTimeout(() => setIsFocused(true), 3000);
        }

        // Create AppNotification
        const notif: AppNotification | null = phone
          ? {
              id: Date.now().toString(),
              type: "phone",
              message: "GET OFF YOUR PHOOOOOONE 📵",
              icon: "📵",
              bgColor: "bg-red-500",
              persistent: true,
            }
          : tired
          ? {
              id: Date.now().toString(),
              type: "tired",
              message: "Take a break 💤",
              icon: "💤",
              bgColor: "bg-yellow-500",
            }
          : fidgety
          ? {
              id: Date.now().toString(),
              type: "fidgety",
              message: "Stop fidgeting 👀",
              icon: "⚡",
              bgColor: "bg-blue-500",
            }
          : null;

        if (notif) setIncoming(notif);
      } catch (e) {
        console.error("Invalid WS message:", e);
      }
    };

    return () => ws.close();
  }, [isFocused, onFocusLost]);

  // Function to send frames to backend
  const sendFrame = useCallback((base64Image: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "frame", image: base64Image }));
  }, []);

  return { incoming, sendFrame, isFocused };
}