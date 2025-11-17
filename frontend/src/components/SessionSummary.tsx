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
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  focusTimeline: number[][]; // [time, focus_score] pairs
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
          focusTimeline: data.focus_timeline || [],
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
          focusTimeline: [],
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
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl shadow-2xl border-0 rounded-3xl bg-white">
        <CardHeader className="text-center space-y-2 py-8 border-b border-gray-100">
          <div className="flex justify-center">
            <div
              className={`w-20 h-20 ${
                stats.completedFully
                  ? "bg-gradient-to-br from-green-400 to-emerald-400"
                  : "bg-gradient-to-br from-purple-400 to-pink-400"
              } rounded-full flex items-center justify-center shadow-xl`}
            >
              {stats.completedFully ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <Clock className="w-10 h-10 text-white" />
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

        <CardContent className="px-8 py-8">
          {/* Main Grid Layout - Centered with Equal Columns */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-12 w-full max-w-5xl min-h-96">
              {/* Left Column: Focus Score and Graph */}
              <div className="flex flex-col space-y-6">
              {/* Focus Score - Highlighted */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 text-center border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Focus Score</div>
                <div
                  className={`text-5xl font-bold ${getFocusScoreColor(
                    stats.focusScore
                  )} mb-1`}
                >
                  {stats.focusScore}%
                </div>
                <div className="text-xs text-gray-700 font-medium">
                  {getFocusMessage(stats.focusScore)}
                </div>
              </div>

              {/* Focus Graph - Simple line only */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex-1 h-80">
                <div className="h-full w-full">
                  <Line
                    data={{
                      labels: ["0m", "1m", "2m", "3m", "4m", "5m"],
                      datasets: [
                        {
                          label: "Focus Score",
                          data: [60, 75, 80, 70, 85, 90],
                          borderColor: "#9333ea",
                          backgroundColor: "transparent",
                          tension: 0.1,
                          fill: false,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                          pointBackgroundColor: "#9333ea",
                          pointBorderColor: "#fff",
                          pointBorderWidth: 2,
                          borderWidth: 3,
                          segment: {
                            borderColor: ctx => '#9333ea',
                          }
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          padding: 12,
                          titleColor: "#fff",
                          bodyColor: "#fff",
                          borderColor: "#9333ea",
                          borderWidth: 1,
                          displayColors: false,
                        },
                      },
                      scales: {
                        x: {
                          display: true,
                          grid: {
                            display: false,
                          },
                          ticks: {
                            color: "#9ca3af",
                            font: {
                              size: 11,
                            },
                          },
                        },
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          min: 0,
                          max: 100,
                          grid: {
                            display: true,
                            color: "rgba(0, 0, 0, 0.05)",
                          },
                          ticks: {
                            color: "#9ca3af",
                            font: {
                              size: 11,
                            },
                            stepSize: 25,
                            callback: (value) => `${value}%`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: All Stats */}
            <div className="space-y-4 flex flex-col">
              {/* Core Session Stats Grid */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="bg-white rounded-xl p-6 border border-purple-100 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-900">
                        {stats.duration}
                      </div>
                      <div className="text-xs text-gray-600">Minutes Studied</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-purple-100 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-900">
                        {stats.breaks}
                      </div>
                      <div className="text-xs text-gray-600">Breaks Taken</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-purple-100 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-900">
                        {stats.interruptions}
                      </div>
                      <div className="text-xs text-gray-600">Interruptions</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-purple-100 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-900">
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
              <div className="grid grid-cols-3 gap-3 flex-1">
                <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-900">
                        {stats.phoneCount}
                      </div>
                      <div className="text-[10px] text-gray-600">Phone checks</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-sky-900">
                        {stats.tiredCount}
                      </div>
                      <div className="text-[10px] text-gray-600">Tired moments</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-pink-900">
                        {stats.fidgetyCount}
                      </div>
                      <div className="text-[10px] text-gray-600">Fidgety moments</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-12">
            <Button
              onClick={() => navigate("/dashboard")}
              className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg px-8"
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