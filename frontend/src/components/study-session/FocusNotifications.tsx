import { useState } from "react";
import { Bell, ChevronUp, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
}

interface FocusNotificationsProps {
  notifications: Notification[];
}

export default function FocusNotifications({ notifications = [] }: FocusNotificationsProps) {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const latestNotification = notifications[0];

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end z-50">
      <AnimatePresence initial={false}>
        <motion.div
          key={expanded ? "expanded" : "collapsed"}
          initial={{ height: expanded ? 80 : 80 }}
          animate={{ height: expanded ? 400 : 80 }} // grows upward
          exit={{ height: 80 }}
          transition={{ duration: 0.3 }}
          className="w-72"
        >
          <Card className="bg-gradient-to-br from-pink-100 to-purple-100 border-pink-200 rounded-2xl shadow-lg flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between text-pink-700 p-2">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-semibold">Focus Alerts</span>
              </div>
              <button onClick={() => setExpanded(!expanded)}>
                {expanded ? (
                  <ChevronDown className="w-5 h-5 text-pink-700" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-pink-700" />
                )}
              </button>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1 px-2 py-1">
              {!expanded ? (
                // Collapsed: show only the latest notification
                latestNotification ? (
                  <div
                    key={latestNotification.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-pink-200 shadow-sm mt-auto"
                  >
                    <p className="text-sm text-gray-700 truncate">
                      {latestNotification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(latestNotification.timestamp)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-pink-400 text-sm mt-auto">
                    <p>You're doing great! 🌟</p>
                    <p className="text-xs mt-1">Stay focused!</p>
                  </div>
                )
              ) : (
                // Expanded: show all notifications
                <div className="flex flex-col-reverse space-y-2 space-y-reverse mt-auto">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-pink-200 shadow-sm"
                    >
                      <p className="text-sm text-gray-700">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}