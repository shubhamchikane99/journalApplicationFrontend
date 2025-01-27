// src/components/Dashboard.js
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Routes, Route } from "react-router-dom";
import Chat from "../pages/Chat";
import JournalEntry from "../pages/JournalEntry";
import TicTacToe from "../pages/TicTacToe";
import NavBar from "../components/Navbar";


const Dashboard = () => {

  const additionalData =   JSON.parse(localStorage.getItem("user"));
  const { logout } = useContext(AuthContext); // Access user and logout
  const navigate = useNavigate(); // For redirection

  const handleLogout = () => {
    logout(); // Clear user data
    navigate("/"); // Redirect to Login page
  };

return (
  <div>
    {/* Use the NavBar component */}
    <NavBar onLogout={handleLogout} />

    {/* Welcome message */}
    <h2>Welcome, {additionalData?.userName}!</h2>

    {/* Define the routes for each feature */}
    <Routes>
      <Route path="chat" element={<Chat />} />
      <Route path="journal-entry" element={<JournalEntry />} />
      <Route path="tic-tac-toe" element={<TicTacToe />} />
    </Routes>
  </div>
);
};

export default Dashboard;
