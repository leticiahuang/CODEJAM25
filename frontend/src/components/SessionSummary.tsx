import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  TrendingUp,
  Coffee,
  AlertCircle,
  CheckCircle,
  Home,
  Smartphone,
  Activity
} from "lucide-react";

interface StatsApiResponse {
  focus_score: number;
  graph: string;             // URL or base64-encoded data URI
  focus_timeline: number[][]; // optional, not used in UI right now
}

// What the frontend already knows about the session (passed from previous page)
interface FrontendSessionInput {
  duration: number;
  breaks: number;
  interruptions: number;
  completedFully: boolean;
  phoneCount: number;
  tiredCount: number;
  fidgetyCount: number;
}

// Full stats used by this page (backend + frontend)
interface SessionStats {
  focusScore: number;
  phoneCount: number;
  tiredCount: number;
  fidgetyCount: number;
  graph: string;
  duration: number;       // in minutes
  breaks: number;
  interruptions: number;
  completedFully: boolean;
}

export default function SessionSummary() {
  const navigate = useNavigate();
  const location = useLocation();

  // What the previous page passed in via navigate("/session-summary", { state: { stats: ... } })
  const sessionInput: FrontendSessionInput | undefined = location.state?.stats;

  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      // base data from frontend so we always have something to show
      const baseInput: FrontendSessionInput = sessionInput || {
        duration: 0,
        breaks: 0,
        interruptions: 0,
        completedFully: false,
        phoneCount: 0,
        tiredCount: 0,
        fidgetyCount: 0
      };

      try {
        const res = await fetch("/api/focus/summary", {
          method: "GET"
        });

        if (!res.ok) {
          throw new Error(
            `Request to retrieve session's focus score failed with status ${res.status}`
          );
        }

        const data: StatsApiResponse = await res.json();
        console.log("Backend focus summary:", data);

        setStats({
          // backend focus_score is assumed 0–1, convert to %
          focusScore: Math.round(data.focus_score * 100),
          // counts come from frontend
          phoneCount: baseInput.phoneCount,
          tiredCount: baseInput.tiredCount,
          fidgetyCount: baseInput.fidgetyCount,
          // graph from backend (if provided)
          graph: data.graph || "",
          duration: baseInput.duration,
          breaks: baseInput.breaks,
          interruptions: baseInput.interruptions,
          completedFully: baseInput.completedFully
        });
      } catch (err) {
        console.error("Error talking to backend:", err);
        setError("We couldn't load your focus stats from the server.");

        const fallbackInput: FrontendSessionInput = sessionInput || {
          duration: 0,
          breaks: 0,
          interruptions: 0,
          completedFully: false,
          phoneCount: 0,
          tiredCount: 0,
          fidgetyCount: 0
        };

        // Fallback: show what we know from frontend only
        setStats({
          focusScore: 0,
          phoneCount: fallbackInput.phoneCount,
          tiredCount: fallbackInput.tiredCount,
          fidgetyCount: fallbackInput.fidgetyCount,
          graph: "",
          duration: fallbackInput.duration,
          breaks: fallbackInput.breaks,
          interruptions: fallbackInput.interruptions,
          completedFully: fallbackInput.completedFully
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [sessionInput]);

  const getFocusScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getFocusMessage = (score: number) => {
    if (score >= 70) return "Excellent focus! Keep it up!";
    if (score >= 50) return "Good job! Room for improvement";
    return "Let's work on staying focused next time";
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl shadow-2xl border-purple-200 rounded-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl font-bold text-purple-700">
              Loading your session summary...
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Crunching your focus stats and attention patterns
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl shadow-2xl border-purple-200 rounded-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div
              className={`w-24 h-24 ${
                stats.completedFully
                  ? "bg-gradient-to-br from-green-400 to-emerald-400"
                  : "bg-gradient-to-br from-purple-400 to-pink-400"
              } rounded-full flex items-center justify-center shadow-xl`}
            >
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
          {error && (
            <p className="text-xs text-red-500 flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Focus Score - Highlighted */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 text-center border-2 border-purple-200">
            <div className="text-sm text-gray-600 mb-2">Focus Score</div>
            <div
              className={`text-6xl font-bold ${getFocusScoreColor(
                stats.focusScore
              )} mb-2`}
            >
              {stats.focusScore}%
            </div>
            <div className="text-sm text-gray-700 font-medium">
              {getFocusMessage(stats.focusScore)}
            </div>
          </div>

          {/* Core Session Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">
                    {stats.duration}
                  </div>
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
                  <div className="text-2xl font-bold text-green-900">
                    {stats.breaks}
                  </div>
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
                  <div className="text-2xl font-bold text-red-900">
                    {stats.interruptions}
                  </div>
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
                    {stats.completedFully
                      ? "100%"
                      : Math.round(
                          (stats.duration / (stats.duration + 10 || 1)) * 100
                        ) + "%"}
                  </div>
                  <div className="text-xs text-gray-600">Completion</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attention Insights: Phone / Tired / Fidgety */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-900">
                    {stats.phoneCount}
                  </div>
                  <div className="text-xs text-gray-600">Phone checks</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-sky-900">
                    {stats.tiredCount}
                  </div>
                  <div className="text-xs text-gray-600">Tired moments</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-pink-900">
                    {stats.fidgetyCount}
                  </div>
                  <div className="text-xs text-gray-600">Fidgety moments</div>
                </div>
              </div>
            </div>
          </div>

          {/* Focus Graph */}
          {stats.graph && (
            <div className="mt-4 bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Focus over time
                </h3>
                <span className="text-[10px] uppercase tracking-wide text-gray-500">
                  Session timeline
                </span>
              </div>
              <div className="w-full overflow-hidden rounded-xl border border-purple-100 bg-purple-50/40">
                <img
                  src={stats.graph}
                  alt="Focus graph for this study session"
                  className="w-full h-48 object-contain"
                />
              </div>
            </div>
          )}

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