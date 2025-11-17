import { useState, useEffect } from "react";
import { NotificationProps } from "./Notification";

export interface AppNotification extends NotificationProps {
  id: string;
  type: "phone" | "tired" | "fidgety";
  persistent?: boolean;
}

interface Props {
  incoming: AppNotification | null;
  children: (current: AppNotification | null, close: () => void) => JSX.Element;
}

export default function NotificationManager({ incoming, children }: Props) {
  const [queue, setQueue] = useState<AppNotification[]>([]);
  const [current, setCurrent] = useState<AppNotification | null>(null);

  // Add new notifications to queue
  useEffect(() => {
    if (incoming) setQueue(prev => [...prev, incoming]);
  }, [incoming]);

  // Display next notification if none is showing
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [queue, current]);

  const closeCurrent = () => setCurrent(null);

  return children(current, closeCurrent);
}