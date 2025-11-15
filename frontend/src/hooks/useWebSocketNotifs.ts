import { useEffect, useState } from "react";
import { AppNotification } from "@/components/study-session/NotificationManager";

export default function useWebSocketNotifications() {
  const [incoming, setIncoming] = useState<AppNotification | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.focus_score !== undefined) {
        setIncoming({
          id: Date.now().toString(),
          message:
            data.focus_score < 50
              ? "Focus lost! Get back to studying 📚"
              : "Great focus! Keep going 👍",
          icon: "⚡",
          bgColor: data.focus_score < 50 ? "bg-red-400" : "bg-green-500",
        });
      }

      if (data.sleepiness !== undefined) {
        setIncoming({
          id: Date.now().toString(),
          message: "Looks sleepy! Take a small break 💤",
          icon: "😴",
          bgColor: "bg-yellow-400",
        });
      }
    };

    ws.onopen = () => console.log("WS CONNECTED");
    ws.onclose = () => console.log("WS CLOSED!");

    return () => {
      ws.close();
    };
  }, []);

  return incoming;
}
