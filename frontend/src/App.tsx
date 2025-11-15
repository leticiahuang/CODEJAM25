import { Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
//import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import StudySession from "./components/StudySession";
import Auth from "./components/Auth";
import SessionSummary from "./components/SessionSummary";
import { set } from "date-fns";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for an existing session when the app loads
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <span className="text-5xl">🎓</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
          {/*<Route path="/home" element={session ? <Home /> : <Navigate to="/" />} />*/}
          <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/study-session" element={session ? <StudySession /> : <Navigate to="/" />} />
          <Route path="/session-summary" element={session ? <SessionSummary /> : <Navigate to="/" />} />
        </Routes>
      </>
    </Suspense>
  );
}export default App;
