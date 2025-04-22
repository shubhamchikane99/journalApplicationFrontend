import React, { useEffect, useState } from "react";
import UserList from "../pages/UserList";
import ChatWindow from "../pages/ChatWindow";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import "../styles/Chat.css";

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
      // Log the values before setting them
      setUsers(data.data.chat || []); // Use chat list in this tab
      setAllUsers(data.data.allUsers || []); // Store all users for another tab
      setRequestUsers(data.data.request || []);
    }
  } catch (err) {
    console.error("Fetch error:", err);
    setError("Failed to fetch users data. Please try again.");
  }
};

const Chat = () => {
  const [users, setUsers] = useState([]); // Chat users
  const [allUsers, setAllUsers] = useState([]); // For future Request tab
  const [requestUsers, setRequestUsers] = useState([]); // For future Request tab
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  // Fetch users when the component loads
  useEffect(() => {
    fetchUsersData(setUsers, setAllUsers, setRequestUsers, setError);

    const loggedInUser = JSON.parse(localStorage.getItem("user"));
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
      <UserList
        users={users}
        allUsers={allUsers} // Pass allUsers here
        requestUsers={requestUsers}
        selectUser={setSelectedUser}
      />

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
