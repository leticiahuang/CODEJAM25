import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Plus, Minus, Clock, TrendingUp, Calendar, LogOut, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SessionHistory {
  id: number;
  user_id: string;
  duration: number;
  focus_score: number;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessionDuration, setSessionDuration] = useState(30); // in minutes
  const [breakInterval, setBreakInterval] = useState(30); // minutes until break
  const [breakDuration, setBreakDuration] = useState(5); // break duration in minutes
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        setUserEmail(user.email || "");
        
        const { data, error } = await supabase
          .from('study_session')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching sessions:', error);
        } else {
          setSessionHistory(data || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = () => {
    navigate("/study-session", { 
      state: { 
        duration: sessionDuration,
        breakInterval: breakInterval,
        breakDuration: breakDuration
      } 
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  const incrementDuration = () => {
    setSessionDuration(prev => Math.min(prev + 15, 180)); // max 3 hours
  };

  const decrementDuration = () => {
    setSessionDuration(prev => Math.max(prev - 15, 15)); // min 15 minutes
  };

  const incrementBreakInterval = () => {
    setBreakInterval(prev => Math.min(prev + 15, 120)); // max 2 hours
  };

  const decrementBreakInterval = () => {
    setBreakInterval(prev => Math.max(prev - 15, 15)); // min 15 minutes
  };

  const incrementBreakDuration = () => {
    setBreakDuration(prev => Math.min(prev + 5, 30)); // max 30 minutes
  };

  const decrementBreakDuration = () => {
    setBreakDuration(prev => Math.max(prev - 5, 5)); // min 5 minutes
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFocusScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/*<Button
            onClick={handleBackToHome}
            variant="ghost"
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>*/}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-full flex items-center justify-center shadow-xl">
              <img
                src="/icon.png"
                alt="App Icon"
                className="w-32 h-32 object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Study Dashboard
              </h1>
              <p className="text-gray-600">Welcome back! Ready to study?</p>
              {userEmail && <p className="text-sm text-purple-600 mt-1">Logged in as: {userEmail}</p>}
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

                {/* Break Interval Settings */}
                <div className="space-y-3 pt-4 border-t border-purple-200">
                  <div className="text-sm font-semibold text-purple-900 text-center">Break Settings</div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Break Interval */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-xs text-gray-600">Break every</div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={decrementBreakInterval}
                          variant="outline"
                          size="icon"
                          className="rounded-full w-8 h-8 border-pink-300 hover:bg-pink-50"
                        >
                          <Minus className="w-3 h-3 text-pink-600" />
                        </Button>
                        <div className="text-2xl font-bold text-pink-900 font-mono w-12 text-center">
                          {breakInterval}
                        </div>
                        <Button
                          onClick={incrementBreakInterval}
                          variant="outline"
                          size="icon"
                          className="rounded-full w-8 h-8 border-pink-300 hover:bg-pink-50"
                        >
                          <Plus className="w-3 h-3 text-pink-600" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600">minutes</div>
                    </div>

                    {/* Break Duration */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-xs text-gray-600">Break duration</div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={decrementBreakDuration}
                          variant="outline"
                          size="icon"
                          className="rounded-full w-8 h-8 border-blue-300 hover:bg-blue-50"
                        >
                          <Minus className="w-3 h-3 text-blue-600" />
                        </Button>
                        <div className="text-2xl font-bold text-blue-900 font-mono w-12 text-center">
                          {breakDuration}
                        </div>
                        <Button
                          onClick={incrementBreakDuration}
                          variant="outline"
                          size="icon"
                          className="rounded-full w-8 h-8 border-blue-300 hover:bg-blue-50"
                        >
                          <Plus className="w-3 h-3 text-blue-600" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600">minutes</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Breaks:</span>
                    <span className="font-semibold text-purple-900">
                      {Math.floor(sessionDuration / breakInterval)} × {breakDuration} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total time:</span>
                    <span className="font-semibold text-purple-900">
                      {sessionDuration + Math.floor(sessionDuration / breakInterval) * breakDuration} min
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
                <CardDescription>Your top 5 most recent study sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : sessionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No study sessions yet</h3>
                    <p className="text-gray-600">Start your first study session to see your progress here!</p>
                  </div>
                ) : (
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
                              {formatDate(session.created_at)}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span>{session.duration} minutes</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Focus Score</div>
                            <Badge className={`${getFocusScoreColor(session.focus_score)} font-bold`}>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {session.focus_score}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
