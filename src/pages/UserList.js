import React, { useEffect, useState } from "react";
import eventBus from "../utils/eventBus"; // ✅ Import eventBus
import "../styles/UserList.css";

const UserList = ({ users, selectUser }) => {
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    // ✅ Listen for typing events globally
    const handleTypingStatus = ({ senderId, receiverId, isTyping }) => {
    
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: isTyping, // ✅ Always update typing status
      }));
    };

    eventBus.on("typingStatus", handleTypingStatus);

    return () => {
      eventBus.off("typingStatus", handleTypingStatus);
    };
  }, []);


  return (
    <div className="user-list">
      <h2>Users</h2>
      {users.map((user) => (
        <div key={user.id} className="user-item" onClick={() => selectUser(user)}>
          {user.firstName}

          {/* ✅ Show "typing" for any user, even if they are not selected */}
          {typingUsers[user.id] && (
            <span className="typing-indicator"> ✍️ typing...</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserList;
