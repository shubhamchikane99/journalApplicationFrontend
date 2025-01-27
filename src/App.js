import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginForm from "./pages/LoginForm";
import NotFound from "./pages/NotFound"; // Import NotFound component
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./utils/ProtectedRoute";
import Chat from "./pages/Chat";
import JournalEntry from "./pages/JournalEntry";
import TicTacToe from "./pages/TicTacToe";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route
            path=":username/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="chat" element={<ProtectedRoute> <Chat /> </ProtectedRoute>} />
          <Route path="journal-entry" element={<ProtectedRoute> <JournalEntry /> </ProtectedRoute>} />
          <Route path="tic-tac-toe" element={<ProtectedRoute> <TicTacToe /> </ProtectedRoute>} />
          {/* Catch-all route for undefined mappings */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
