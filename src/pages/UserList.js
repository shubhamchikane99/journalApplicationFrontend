import React, { useEffect, useState } from "react";
import eventBus from "../utils/eventBus";
import "../styles/UserList.css";

const UserList = ({ users, selectUser }) => {
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // Listen for typing events globally
    const handleTypingStatus = ({ senderId, receiverId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: isTyping, // Always update typing status
      }));
    };

    // Listen for online/offline status updates
    const handleOnlineOfflineStatus = ({ updatedUsers }) => {
      setOnlineUsers(updatedUsers);
    };

    eventBus.on("typingStatus", handleTypingStatus);
    eventBus.on("onlineOfflineStatus", handleOnlineOfflineStatus);

    return () => {
      eventBus.off("typingStatus", handleTypingStatus);
    };
  }, []);

  return (
    <div className="user-list">
      <h2>Users</h2>
      {users.map((user) => (
        <div
          key={user.id}
          className="user-item"
          onClick={() => selectUser(user)}
        >
          {user.firstName}
          {/*  Show online/offline status */}
          {Array.isArray(onlineUsers) && onlineUsers.includes(user.id) ? (
            <span className="online-status"> </span>
          ) : (
            <span className="offline-status"> </span>
          )}

          {/* Show "typing" for any user */}
          {typingUsers[user.id] && (
            <span className="typing-indicator"> ✍️ typing...</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserList;
