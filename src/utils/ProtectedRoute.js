// src/components/PrivateRoute.js
import React, { useContext } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { username } = useParams(); // Get username from URL
  console.log("username f " + username)

  let storedUsername = localStorage.getItem("userName");
  storedUsername = storedUsername.replace(/['"]+/g, "");
  console.log("storedUsername f " + storedUsername)

  // Check if user is authenticated and username matches
  if (!user || storedUsername !== username) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
