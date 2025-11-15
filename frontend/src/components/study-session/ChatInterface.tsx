import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatInterfaceProps {
  onVideoRequest: (videoUrl: string) => void;
}

export default function ChatInterface({ onVideoRequest }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi there! I'm your Study Buddy! 🎓 Ask me anything or request study materials to help you learn.",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const generateAIResponse = (userInput: string): Message => {
    const lowerInput = userInput.toLowerCase();
    
    // Check for video requests
    if (lowerInput.includes("video") || lowerInput.includes("watch") || lowerInput.includes("show me")) {
      setTimeout(() => {
        onVideoRequest("https://www.youtube.com/embed/dQw4w9WgXcQ");
      }, 500);
      
      return {
        id: (Date.now() + 1).toString(),
        text: "Great! I've loaded a study video for you in the center. Let me know if you need anything else! 📺",
        sender: "ai",
        timestamp: new Date()
      };
    }

    // Default responses
    const responses = [
      "That's a great question! Let me help you with that. 🤔",
      "I'm here to support your learning journey! What specific topic would you like to explore? 📚",
      "Interesting! Would you like me to find some study materials on this topic? 🔍",
      "I can help you with that! Feel free to ask for videos or explanations. ✨"
    ];

    return {
      id: (Date.now() + 1).toString(),
      text: responses[Math.floor(Math.random() * responses.length)],
      sender: "ai",
      timestamp: new Date()
    };
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400">
            <AvatarFallback className="text-white font-bold">SB</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-purple-900">Study Buddy</h3>
            <p className="text-xs text-purple-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Always here to help
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.sender === "user"
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                    : "bg-gradient-to-br from-purple-50 to-pink-50 text-gray-800 border border-purple-200"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1 ${message.sender === "user" ? "text-purple-100" : "text-gray-400"}`}>
                  {message.timestamp.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Study Buddy anything..."
            className="rounded-full border-purple-300 focus:border-purple-500 bg-white"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-center text-purple-400 mt-2 flex items-center justify-center">
          <Sparkles className="w-3 h-3 mr-1" />
          Powered by AI
        </p>
      </div>
    </div>
  );
}
