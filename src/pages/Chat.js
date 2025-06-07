import React, { useEffect, useState, useContext } from "react";
import UserList from "../pages/UserList";
import ChatWindow from "../pages/ChatWindow";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Chat.css";
import NavBar from "../components/Navbar"; // <-- import your NavBar here

// Function to fetch users
const fetchUsersData = async (
  setUsers,
  setAllUsers,
  setRequestUsers,
  setError
) => {
  try {
    const data = await fetchData(endPoint.users + "/get-all");

    if (data.error || data.data?.error) {
      setError(data.data?.errorMessage || "Failed to fetch users.");
      return;
    }

    if (data.data) {
      setUsers(data.data.chat || []);
      setAllUsers(data.data.allUsers || []);
      setRequestUsers(data.data.request || []);
    }
  } catch (err) {
    console.error("Fetch error:", err);
    setError("Failed to fetch users data. Please try again.");
  }
};

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [requestUsers, setRequestUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsersData(setUsers, setAllUsers, setRequestUsers, setError);

    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
    } else {
      setError("You are not logged in.");
    }
  }, []);

  const { logout } = useContext(AuthContext); // Access user and logout
  const navigate = useNavigate(); // For redirection

  const handleLogout = () => {
    logout(); // Clear user data
    navigate("/"); // Redirect to Login page
  };

  return (
    <div className="chat-page">
      <NavBar onLogout={handleLogout} /> {/* <-- Add NavBar at the top */}
      <div className="chat-container">
        {/* Display error message if there's any */}
        {error && <div className="error-message">{error}</div>}

        {/* Left Side - User List */}
        <UserList
          users={users}
          allUsers={allUsers}
          requestUsers={requestUsers}
          selectUser={setSelectedUser}
        />

        {/* Right Side - Chat Window */}
        {selectedUser && currentUser ? (
          <ChatWindow
            selectedUser={selectedUser}
            currentUser={currentUser}
            setSelectedUser={setSelectedUser}
          />
        ) : (
          <div className="chat-placeholder" style={{ fontFamily: "monospace" }}>
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
