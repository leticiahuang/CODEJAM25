import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface CenterStageProps {
  isVideoPlaying: boolean;
  videoUrl: string | null;
  onCloseVideo: () => void;
}

export default function CenterStage({ 
  isVideoPlaying = false, 
  videoUrl = null, 
  onCloseVideo 
}: CenterStageProps) {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <AnimatePresence mode="wait">
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
                  y: [0, -20, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-64 h-64 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-full flex items-center justify-center shadow-2xl"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-8xl"
                >
                  🎓
                </motion.div>
              </motion.div>
              
              {/* Floating sparkles */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-4 -right-4 text-4xl"
              >
                ✨
              </motion.div>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -bottom-4 -left-4 text-4xl"
              >
                💫
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Study Buddy
              </h2>
              <p className="text-gray-600 max-w-md">
                I'm here to help you focus and learn! Ask me questions or request study materials in the chat.
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

            {/* Mini Mascot in corner */}
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg z-10"
            >
              <span className="text-3xl">🎓</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
