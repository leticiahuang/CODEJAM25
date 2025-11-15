import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import StudySession from "./components/StudySession";
import SessionSummary from "./components/SessionSummary";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/study-session" element={<StudySession />} />
          <Route path="/session-summary" element={<SessionSummary />} />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;