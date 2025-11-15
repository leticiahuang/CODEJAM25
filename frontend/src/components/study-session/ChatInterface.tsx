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


// what we expect back from the backend!!!!!! this is defined in our backend too!!!!!!!
interface ChatApiResponse {
  reply: string;
  videoUrl?: string | null;
  shouldPlayVideo?: boolean;
}


export default function ChatInterface({ onVideoRequest }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi there! Do you want to set a video as a background as you study?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  //auto scroll to the bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);


  //HANDLE SENDING A MESSAGE LOGIC  
  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    //USER MESSAGE
    const userText = input;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      timestamp: new Date()
    };

    // show the user's message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    //TRY AND GET RESPONSE FROM THE BACKEND ENDPOINT!!!
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { //additional information sent along with an HTTP request. says: type of data being sent is json type
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userText,
          // optional: send chat history for more context
          history: messages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: ChatApiResponse = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: "ai",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // if backend found a video, hook into existing video UI
      const shouldPlay =
        data.shouldPlayVideo ?? Boolean(data.videoUrl);

      if (shouldPlay && data.videoUrl) {
        onVideoRequest(data.videoUrl);
      }

    } catch (error) {
      console.error("Error talking to backend:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "Sorry, I ran into a problem talking to the server. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
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
            placeholder="What video do you want to play?.."
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
