import React from "react";
import { BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/Routes";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>{AppRoutes}</Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
