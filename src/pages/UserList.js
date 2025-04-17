import React, { useEffect, useState } from "react";
import eventBus from "../utils/eventBus";
import "../styles/UserList.css";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const UserList = ({ users, selectUser }) => {
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const loggedInUser = JSON.parse(localStorage.getItem("user"));

  // Initialize unread counts when users list changes
  useEffect(() => {
    const initialCounts = {};
    users.forEach((user) => {
      initialCounts[user.id] = user.unreadMsgCount || 0;
    });
    setUnreadCounts(initialCounts);
  }, [users]);

  useEffect(() => {
    // Listen for typing events globally
    const handleTypingStatus = ({ senderId, receiverId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: isTyping, // Always update typing status
      }));
    };

    eventBus.on("typingStatus", handleTypingStatus);

    return () => {
      eventBus.off("typingStatus", handleTypingStatus);
    };
  }, []);

  const handleSelectedUser = ({ selectedUserId }) => {
    setSelectedUsers(selectedUserId);
  };

  useEffect(() => {
    eventBus.on("selectedUsers", handleSelectedUser);

    // Cleanup on unmount to avoid memory leaks
    return () => {
      eventBus.off("selectedUsers", handleSelectedUser);
    };
  }, []);

  // Web socket connect for msg count update in real-time
  useEffect(() => {
    const userId = loggedInUser.id;
    const apiUrl = process.env.REACT_APP_BACKEND_URL;
    const socket = new SockJS(`${apiUrl}/ws`);
    //const socket = new SockJS("https://journalapplication-production-8570.up.railway.app/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => str,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000, // Add heartbeat for connection stability
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setIsConnected(true);
        setError(null);

        client.subscribe(`/topic/private-unread-msg/${userId}`, (message) => {
          const senderId = message.body;

          if (selectedUsers !== senderId) {
            setUnreadCounts((prev) => {
              const newCounts = { ...prev };
              newCounts[senderId] = (newCounts[senderId] || 0) + 1;
              return newCounts;
            });
          }
        });

        //onlineOffline Users
        client.subscribe(`/topic/online-offline-user`, (message) => {
          const updatedOnlineUsers = JSON.parse(message.body); // Ensure it's an array

          const onlineUsersArray = Array.isArray(updatedOnlineUsers)
            ? updatedOnlineUsers
            : [];
          setOnlineUsers(Array.from(onlineUsersArray));
        });
      },

      onDisconnect: () => {
        setIsConnected(false);
        setError("Disconnected. Reconnecting...");
      },

      onStompError: (frame) => {
        setError("Server error. Please try again later.");
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [loggedInUser.id, selectedUsers]);

  // Check if STOMP is disconnected before publishing
  useEffect(() => {
    if (stompClient && !isConnected) {
      stompClient.activate();
    } else if (error) {
    }
  }, [isConnected, stompClient, error]);

  // Reset unread count on chat open
  const handleSelectUser = (user) => {
    selectUser(user);
    setUnreadCounts((prev) => ({
      ...prev,
      [user.id]: 0,
    }));
  };

  return (
    <div className="user-list">
      <h2>Users</h2>
      {users.map((user) => (
        <div
          key={user.id}
          className="user-item"
          onClick={() => {
            selectUser(user);
            handleSelectUser(user);
          }}
        >
          {user.firstName}

          {/*  Show online/offline status */}
          {Array.isArray(onlineUsers) && onlineUsers.length > 0 ? (
            onlineUsers.includes(user.id) ? (
              <span className="online-status"> </span>
            ) : (
              <span className="offline-status"> </span>
            )
          ) : user.isActive === 1 ? (
            <span className="online-status"> </span>
          ) : (
            <span className="offline-status"> </span>
          )}

          {/* Show "typing" for any user */}
          {typingUsers[user.id] && (
            <span className="typing-indicator"> ✍️ typing...</span>
          )}
          {/* Show unread message count */}
          {unreadCounts[user.id] > 0 && (
            <span className="unread-count">
              ({unreadCounts[user.id]} unread)
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserList; //
