import React, { useContext } from "react";
import { Navigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { username } = useParams(); // Get username from URL
  const location = useLocation(); // Get current route path

  // Get stored username from local storage and sanitize
  let storedUsername = localStorage.getItem("userId");
  storedUsername = storedUsername ? storedUsername.replace(/['"]+/g, "") : "";

  // Apply the condition only for the dashboard route
  if (
    location.pathname.includes("/dashboard") &&
    (!user || storedUsername !== username)
  ) {
    return <Navigate to="/" replace />;
  } else if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
