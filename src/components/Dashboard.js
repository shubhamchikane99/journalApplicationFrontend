// src/components/Dashboard.js
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {

  const additionalData =  localStorage.getItem("user");

  const { user, logout } = useContext(AuthContext); // Access user and logout
  console.log("user " + user.userName)

  const navigate = useNavigate(); // For redirection

  const handleLogout = () => {
    logout(); // Clear user data
    navigate("/"); // Redirect to Login page
  };


  return (
    <div>
      <h2>Welcome {additionalData?.userName}</h2>
      <p>Data: {JSON.stringify(additionalData)}</p>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
