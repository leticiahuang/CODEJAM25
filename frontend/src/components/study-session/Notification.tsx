import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

export interface NotificationProps {
  message: string;
  icon?: string;
  bgColor?: string;
  duration?: number;
  type?: "phone" | "tired" | "fidgety"; 
  persistent?: boolean;
  onClose?: () => void;
}

export default function Notification({
  message,
  icon = "⚡",
  bgColor = "bg-red-400",
  duration = 3000,
  type,
  persistent = false,
  onClose,
}: NotificationProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio based on type
  const audioMap: Record<NotificationProps["type"], string> = {
    phone: "/airhorn.mp3",
    tired: "/twinkle.mp3",
    fidgety: "/airhorn.mp3",
  };

  useEffect(() => {
    if (type && audioRef.current) {
      audioRef.current.src = audioMap[type];
      audioRef.current.currentTime = 0;
      if (type === "phone") {
        audioRef.current.loop = true;   
      } else {
        audioRef.current.loop = false;
      }
      audioRef.current
        .play()
        .catch((err) => console.warn("Audio failed to play:", err));
    }
  }, [type]);

  useEffect(() => {
    if (persistent) return;
    timerRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.loop = false;
      }
      onClose?.();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [persistent, duration, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key={message}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
        className={`absolute inset-0 flex items-center justify-center z-[9999]`}
      >
        <div
        className={`flex flex-col items-center justify-center ${bgColor}
          rounded-3xl shadow-2xl px-10 py-8 w-[90%] max-w-[900px] h-[80%]`}
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.loop = false;
              }
              onClose?.();
            }}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white 
             rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg"
          >
            ✕
          </button> 
          <span className="text-8xl">{icon}</span>
          <h2 className="text-3xl font-bold text-white mt-6 text-center">
            {message}
          </h2>
        </div>
      </motion.div>
      {/* Audio element */}
      <audio ref={audioRef} />
    </AnimatePresence>
  );
}
