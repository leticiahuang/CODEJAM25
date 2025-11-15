import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export interface NotificationProps {
  message: string;
  icon?: string;
  bgColor?: string;
  duration?: number;
  onClose?: () => void;
}

export default function Notification({
  message,
  icon = "⚡",
  bgColor = "bg-red-400",
  duration = 2000,
  onClose,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key={message}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className={`absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center ${bgColor} z-50 rounded-3xl shadow-2xl px-6 py-4`}
      >
        <span className="text-4xl">{icon}</span>
        <h2 className="text-xl font-bold text-white mt-2 text-center">{message}</h2>
      </motion.div>
    </AnimatePresence>
  );
}
