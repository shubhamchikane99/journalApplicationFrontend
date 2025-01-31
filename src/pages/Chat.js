import React, { useEffect, useState } from "react";
import UserList from "../pages/UserList";
import ChatWindow from "../pages/ChatWindow";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import "../styles/Chat.css";

// Function to fetch users
const fetchUsersData = async (setUsers, setError) => {
  try {
    const data = await fetchData(endPoint.public + "/get-all");

    if (data.error || data.data.error) {
      setError(data.data.errorMessage || "Failed to fetch users.");
      return;
    }

    if (data.data && Array.isArray(data.data)) {
      console.log("set Data", data.data);
      setUsers(data.data); // Set the fetched users
    }
  } catch (err) {
    setError("Failed to fetch users data. Please try again.");
  }
};

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Logged-in user
  const [error, setError] = useState("");

  // Fetch users when the component loads
  useEffect(() => {
    fetchUsersData(setUsers, setError); // Call the function to fetch users

    // Get the logged-in user from local storage (from login)
    const loggedInUser = localStorage.getItem("usersId"); // Change to session storage if needed
    console.log("loggedInUser " + loggedInUser)
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
    } else {
      setError("You are not logged in.");
    }
  }, []); 

  return (
    <div className="chat-container">
      {/* Display error message if there's any */}
      {error && <div className="error-message">{error}</div>}

      {/* Left Side - User List */}
      <UserList users={users} selectUser={setSelectedUser} />

      {/* Right Side - Chat Window */}
      {selectedUser && currentUser ? (
        <ChatWindow selectedUser={selectedUser} currentUser={currentUser} />
      ) : (
        <div className="chat-placeholder">Select a user to start chatting</div>
      )}
    </div>
  );
};

export default Chat;
