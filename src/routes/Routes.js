import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../utils/ProtectedRoute";
import LoginForm from "../pages/LoginForm";
import NotFound from "../pages/NotFound";
import Dashboard from "../pages/Dashboard";
import Chat from "../pages/Chat";
import JournalEntry from "../pages/JournalEntry";
import TicTacToe from "../pages/TicTacToe";
import SignUpForm from "../pages/SignUpForm"

const AppRoutes = [
  <Route key="login" path="/" element={<LoginForm />} />,
  <Route path="/signup" element={<SignUpForm />} />,
  <Route
    key="dashboard"
    path=":username/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="chat"
    path="chat"
    element={
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    }
  />,
  <Route
    key="journal-entry"
    path="journal-entry"
    element={
      <ProtectedRoute>
        <JournalEntry />
      </ProtectedRoute>
    }
  />,
  <Route
    key="tic-tac-toe"
    path="tic-tac-toe"
    element={
      <ProtectedRoute>
        <TicTacToe />
      </ProtectedRoute>
    }
  />,
  <Route key="not-found" path="*" element={<NotFound />} />,
];

export default AppRoutes;
