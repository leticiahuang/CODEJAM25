import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import StudySession from "./components/StudySession";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study-session" element={<StudySession />} />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;