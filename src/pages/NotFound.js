// src/components/NotFound.js
import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleBackToDashboard = () => {
    let  username = localStorage.getItem("userName"); // Retrieve the username from localStorage or another context
    console.log("username " + username)
    if (username) {
      username = username.replace(/['"]+/g, "");
      navigate(`/${username}/dashboard`); // Navigate to the dynamic dashboard URL
    } else {
      navigate("/"); // Fallback in case username is not found
    }
  };

  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Page Not Found</p>
      <button onClick={handleBackToDashboard}> Back to Dashboard </button>
    </div>
  );
};

export default NotFound;
