import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Plus, Minus, Clock, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SessionHistory {
  id: string;
  date: string;
  length: number; // in minutes
  focusScore: number; // 0-100
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessionDuration, setSessionDuration] = useState(30); // in minutes

  // Mock session history
  const [sessionHistory] = useState<SessionHistory[]>([
    { id: "1", date: "2024-01-15", length: 45, focusScore: 87 },
    { id: "2", date: "2024-01-14", length: 60, focusScore: 92 },
    { id: "3", date: "2024-01-14", length: 30, focusScore: 78 },
    { id: "4", date: "2024-01-13", length: 90, focusScore: 85 },
    { id: "5", date: "2024-01-12", length: 45, focusScore: 91 },
  ]);

  const handleStartSession = () => {
    navigate("/study-session", { state: { duration: sessionDuration } });
  };

  const incrementDuration = () => {
    setSessionDuration(prev => Math.min(prev + 15, 180)); // max 3 hours
  };

  const decrementDuration = () => {
    setSessionDuration(prev => Math.max(prev - 15, 15)); // min 15 minutes
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFocusScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-full flex items-center justify-center shadow-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Study Buddy
              </h1>
              <p className="text-gray-600">Welcome back! Ready to study?</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Start New Session */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-purple-200 rounded-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-900">Start New Session</CardTitle>
                <CardDescription>Set your study duration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-6xl font-bold text-purple-900 font-mono">
                    {sessionDuration}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">minutes</div>
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={decrementDuration}
                      variant="outline"
                      size="icon"
                      className="rounded-full w-12 h-12 border-purple-300 hover:bg-purple-50"
                    >
                      <Minus className="w-5 h-5 text-purple-600" />
                    </Button>
                    <Button
                      onClick={incrementDuration}
                      variant="outline"
                      size="icon"
                      className="rounded-full w-12 h-12 border-purple-300 hover:bg-purple-50"
                    >
                      <Plus className="w-5 h-5 text-purple-600" />
                    </Button>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Breaks:</span>
                    <span className="font-semibold text-purple-900">
                      {Math.floor(sessionDuration / 30)} × 5 min
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total time:</span>
                    <span className="font-semibold text-purple-900">
                      {sessionDuration + Math.floor(sessionDuration / 30) * 5} min
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleStartSession}
                  className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                  size="lg"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Start Session
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Recent Sessions */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-purple-200 rounded-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-900">Recent Sessions</CardTitle>
                <CardDescription>Your study history and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionHistory.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-purple-900">
                            {formatDate(session.date)}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span>{session.length} minutes</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Focus Score</div>
                          <Badge className={`${getFocusScoreColor(session.focusScore)} font-bold`}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {session.focusScore}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
