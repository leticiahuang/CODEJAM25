import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
}

interface FocusNotificationsProps {
  notifications: Notification[];
}

export default function FocusNotifications({ notifications = [] }: FocusNotificationsProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="m-4 mt-auto p-4 bg-gradient-to-br from-pink-100 to-purple-100 border-pink-200 rounded-2xl shadow-lg flex-1 flex flex-col min-h-0">
      <div className="flex items-center space-x-2 text-pink-700 mb-3">
        <Bell className="w-4 h-4" />
        <span className="text-sm font-semibold">Focus Alerts</span>
      </div>

      <ScrollArea className="flex-1 pr-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-pink-400 text-sm">
            <p>You're doing great! 🌟</p>
            <p className="text-xs mt-1">Stay focused!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-pink-200 shadow-sm animate-in slide-in-from-top duration-300"
              >
                <p className="text-sm text-gray-700">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(notification.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
