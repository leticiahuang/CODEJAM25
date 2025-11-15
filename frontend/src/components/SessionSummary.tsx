import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Coffee, AlertCircle, CheckCircle, Home } from "lucide-react";

interface SessionStats {
  duration: number; // in minutes
  focusScore: number;
  breaks: number;
  interruptions: number;
  completedFully: boolean;
}

export default function SessionSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const stats: SessionStats = location.state?.stats || {
    duration: 0,
    focusScore: 0,
    breaks: 0,
    interruptions: 0,
    completedFully: false
  };

  const getFocusScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getFocusMessage = (score: number) => {
    if (score >= 85) return "Excellent focus! Keep it up! 🌟";
    if (score >= 70) return "Good job! Room for improvement 💪";
    return "Let's work on staying focused next time 📚";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl shadow-2xl border-purple-200 rounded-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`w-24 h-24 ${stats.completedFully ? 'bg-gradient-to-br from-green-400 to-emerald-400' : 'bg-gradient-to-br from-purple-400 to-pink-400'} rounded-full flex items-center justify-center shadow-xl`}>
              {stats.completedFully ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : (
                <Clock className="w-12 h-12 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {stats.completedFully ? "Session Complete!" : "Session Ended"}
          </CardTitle>
          <p className="text-gray-600">Here's how you did</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Focus Score - Highlighted */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 text-center border-2 border-purple-200">
            <div className="text-sm text-gray-600 mb-2">Focus Score</div>
            <div className={`text-6xl font-bold ${getFocusScoreColor(stats.focusScore)} mb-2`}>
              {stats.focusScore}%
            </div>
            <div className="text-sm text-gray-700 font-medium">
              {getFocusMessage(stats.focusScore)}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">{stats.duration}</div>
                  <div className="text-xs text-gray-600">Minutes Studied</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">{stats.breaks}</div>
                  <div className="text-xs text-gray-600">Breaks Taken</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-900">{stats.interruptions}</div>
                  <div className="text-xs text-gray-600">Interruptions</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.completedFully ? "100%" : Math.round((stats.duration / (stats.duration + 10)) * 100) + "%"}
                  </div>
                  <div className="text-xs text-gray-600">Completion</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => navigate("/dashboard")}
              className="flex-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
