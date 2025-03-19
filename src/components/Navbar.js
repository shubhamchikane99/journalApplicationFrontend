import React from "react";
import { Link } from "react-router-dom";
import { endPoint } from "../services/endPoint";
import { fetchData } from "../services/apiService";
import { postData } from "../services/apiService";
import "../styles/NavBar.css"; // Import the CSS file

const NavBar = ({ onLogout }) => {
  const fetchLoginData = async () => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    try {
      const data = await fetchData(
        endPoint.users + "/active-status-update?id=" + loggedInUser.id
      );
      if (data.data.statusCode === 200) {
        const onlineOfflineUserPayload = {
          userId: loggedInUser.id,
          activeInActive: false,
        };
        await postData(
          endPoint.chatMessage + `/online-offline-status`,
          onlineOfflineUserPayload
        );
        onLogout();
      }
    } catch (err) {
      alert("Failed to fetch login data. Please try again.");
    }
  };

  return (
    <nav className="navbar">
      <div class="nav-links">
        <Link to="/journal-entry">Journal Entry</Link>
        <Link to="/chat">Chat</Link>
        <Link to="/tic-tac-toe">Tic Tac Toe</Link>
      </div>
      <button class="logout-btn" onClick={fetchLoginData}>
        Logout
      </button>
    </nav>
  );
};

export default NavBar;
