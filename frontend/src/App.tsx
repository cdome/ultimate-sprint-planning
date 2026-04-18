import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Home } from "./pages/Home";
import { Room } from "./pages/Room";
import { Admin } from "./pages/Admin";
import { ThemeSelector } from "./components/ThemeSelector";

const SLOGANS = [
  "Better Than Ever.",
  "Where Marathons Start.",
  "Mostly Stable.",
  "Occasionally Useful.",
  "Feeling All In?",
  "Better Than Prediction Markets.",
  "Fibonacci Never Lies.",
  "Your Scrum Master's Favorite Excuse.",
  "No Estimates Were Harmed.",
  "Turning Disagreements Into Meetings Since 2026.",
];

const slogan = SLOGANS[Math.floor(Math.random() * SLOGANS.length)];

export default function App() {
  return (
    <BrowserRouter>
      <header className="site-header">
        <div className="site-header-title">
          <h1 className="site-title">Ultimate Planning Poker Tool v2</h1>
          <p className="site-tagline">{slogan}</p>
        </div>
        <ThemeSelector />
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <footer className="site-footer">
        <Link to="/admin">Admin</Link>
      </footer>
    </BrowserRouter>
  );
}
