import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Notification, { NotificationProps } from "./Notification";

interface CenterStageProps {
  isVideoPlaying: boolean;
  videoUrl: string | null;
  onCloseVideo: () => void;
  notification?: NotificationProps | null;
  onCloseNotification?: () => void;
}

export default function CenterStage({ 
  isVideoPlaying = false, 
  videoUrl = null, 
  onCloseVideo,
  notification = null,
  onCloseNotification
}: CenterStageProps) {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <AnimatePresence mode="wait">
        {/* Show Notification if any */}
        {notification && (
          <Notification
            key={notification.message}
            {...notification}
            onClose={onCloseNotification}
          />
        )}
        {!isVideoPlaying ? (
          <motion.div
            key="mascot"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Study Buddy Mascot */}
            <div className="relative">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-64 h-64 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-full flex items-center justify-center shadow-2xl"
              >
              <motion.img
              //THIS IS THE GIF URL
              src="icon.png"
              animate={{ rotate: [0, 2, -2, 0] }}
              transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-48 h-48 object-contain rounded-full"
            />
              </motion.div>
              
              {/* Floating sparkles!!!!!!!!!!! */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-4 -left-4"
              >
                <img src="star.png" className="w-10 h-auto object-contain" style={{ objectFit: "contain" }} />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5]}}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                 className="absolute -bottom-4 -right-4"
              >
               <img src="star.png" className="w-10 h-auto object-contain" style={{ objectFit: "contain" }}/>
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Study Buddy
              </h2>
              <p className="text-gray-600 max-w-md">
                Time to lock in!
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="video"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full max-w-5xl max-h-[80vh] relative rounded-3xl overflow-hidden shadow-2xl bg-black"
          >
            {/* Video Player */}
            <iframe
              src={videoUrl || ""}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Close Button */}
            <Button
              onClick={onCloseVideo}
              size="icon"
              className="absolute top-4 right-4 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg z-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}