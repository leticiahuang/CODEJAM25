import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles } from "lucide-react";

function Home() {
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <GraduationCap className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Study Buddy
          </h1>
          
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            Your friendly AI companion for focused and effective studying
          </p>
        </div>

        <Link to="/study-session">
          <Button 
            size="lg" 
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl text-lg px-8 py-6"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Study Session
          </Button>
        </Link>

        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
            <div className="text-4xl mb-2">⏱️</div>
            <h3 className="font-semibold text-purple-900 mb-1">Track Time</h3>
            <p className="text-sm text-gray-600">Monitor your study sessions</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-200 shadow-lg">
            <div className="text-4xl mb-2">🎥</div>
            <h3 className="font-semibold text-pink-900 mb-1">Stay Focused</h3>
            <p className="text-sm text-gray-600">AI-powered focus detection</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200 shadow-lg">
            <div className="text-4xl mb-2">💬</div>
            <h3 className="font-semibold text-blue-900 mb-1">Get Help</h3>
            <p className="text-sm text-gray-600">Chat with Study Buddy AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;