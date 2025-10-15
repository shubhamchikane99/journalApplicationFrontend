import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Routes, Route } from "react-router-dom";
import Chat from "../pages/Chat";
import JournalEntry from "../pages/JournalEntry";
import TicTacToe from "../pages/TicTacToe";
import NavBar from "../components/Navbar";
import "../styles/Dashboard.css"; // ✅ Linked CSS file

const Dashboard = () => {
  const additionalData = JSON.parse(localStorage.getItem("user"));
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning 🌞";
    if (hour < 18) return "Good Afternoon ☀️";
    return "Good Evening 🌙";
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <NavBar onLogout={handleLogout} />

      {/* Logo + Title */}
      <div className="logo-section">
        <div className="app-logo">TC</div>
        <h1 className="dashboard-title">ThoughtConnect</h1>
        <p className="dashboard-tagline">Connect. Reflect. Grow.</p>
      </div>

      {/* Greeting */}
      <div className="greeting-section">
        <h2 className="greeting-text">
          {getGreeting()}, {additionalData?.userName}! 👋
        </h2>
        <p className="welcome-text">
          Welcome to your personal space — Chat with friends and write your
          thoughts.
        </p>
      </div>

      {/* Routes */}
      <div className="routes-section">
        <Routes>
          <Route path="chat" element={<Chat />} />
          <Route path="journal-entry" element={<JournalEntry />} />
          <Route path="tic-tac-toe" element={<TicTacToe />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
