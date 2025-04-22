import React, { useEffect, useState } from "react";
import eventBus from "../utils/eventBus";
import "../styles/UserList.css";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const UserList = ({ users, allUsers, requestUsers, selectUser }) => {
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [activeTab, setActiveTab] = useState("chat");
  const [requestUserList, setRequestUserList] = useState([]); // For future Request tab
  const [requestCounts, setRequestCounts] = useState(0);
  const [userListWithRequestFlag, setUserListWithRequestFlag] = useState([]);
  const [acceptRequestUsersList, setAcceptRequestUsersList] = useState([]);
  const [isRequestUpdateFromSocket, setIsRequestUpdateFromSocket] =
    useState(false);

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

        console.log("web socker in connect");

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

        //when send request the showing on request tab real time
        client.subscribe(`/topic/user-request-list/${userId}`, (message) => {
          const requestUserList = JSON.parse(message.body);
          setRequestCounts((prevCount) => prevCount + 1);
          console.log("call is here");
          setRequestUserList(requestUserList);
        });

        //when send request then shwoing button connect to pending
        client.subscribe(
          `/topic/user-list-with-request-flag/${userId}`,
          (message) => {
            const userListWithRequestFlag = JSON.parse(message.body);

            setUserListWithRequestFlag(userListWithRequestFlag);
          }
        );

        //when accept the request then update user in chat section
        client.subscribe(
          `/topic/accept-request-users-list/${userId}`,
          (message) => {
            const acceptRequestUsers = JSON.parse(message.body);

            setAcceptRequestUsersList(acceptRequestUsers);
          }
        );

        //update request user list when accept the request
        client.subscribe(
          `/topic/user-request-list-update/${userId}`,
          (message) => {
            const requestUserList = JSON.parse(message.body);

            setRequestUserList(requestUserList);
            setIsRequestUpdateFromSocket(true);
          }
        );
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

  const handleUserClick = (user) => {
    selectUser(user);
    handleSelectUser(user);
  };

  // Handle sending friend request
  const handleSendRequest = (userId) => {
    if (stompClient && isConnected) {
      const payload = {
        userId: userId,
        requestUserId: loggedInUser.id,
        flag: 0,
      };

      stompClient.publish({
        destination: "/app/send-friend-request",
        body: JSON.stringify(payload),
      });
    } else {
      console.error("Cannot accept friend request: WebSocket not connected");
    }
  };

  const handleAcceptRequest = (requestId) => {
    if (stompClient && isConnected) {
      stompClient.publish({
        destination: "/app/accept-friend-request",
        body: JSON.stringify({
          requestId: requestId,
          flag: 1,
        }),
      });
    } else {
      console.error("Cannot accept friend request: WebSocket not connected");
    }
  };

  // Handle rejecting friend request
  const handleRejectRequest = (requestId) => {
    if (stompClient && isConnected) {
      
      stompClient.publish({
        destination: "/app/reject-friend-request",
        body: JSON.stringify({
          requestId: requestId,
          flag: 3,
        }),
      });
    } else {
      console.error("Cannot reject friend request: WebSocket not connected");
    }
  };

  // Logic for filtering users for each

  const getTabUsers = () => {
    switch (activeTab) {
      case "chat":
        return acceptRequestUsersList.length > 0
          ? acceptRequestUsersList
          : users || [];
      case "request":
        return isRequestUpdateFromSocket
          ? requestUserList // show even if empty
          : requestUserList.length > 0
          ? requestUserList
          : requestUsers || [];

      case "friend":
        return userListWithRequestFlag.length > 0
          ? userListWithRequestFlag
          : allUsers || [];
      default:
        return [];
    }
  };

  return (
    <div className="user-list-container">
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
        <button
          className={`tab-button ${activeTab === "request" ? "active" : ""}`}
          onClick={() => setActiveTab("request")}
        >
          Requests{" "}
          {isRequestUpdateFromSocket
            ? `(${requestUserList?.length || 0})`
            : requestUsers?.length > 0 || requestCounts > 0
            ? `(${(requestUsers?.length || 0) + requestCounts})`
            : ""}
        </button>
        <button
          className={`tab-button ${activeTab === "friend" ? "active" : ""}`}
          onClick={() => setActiveTab("friend")}
        >
          Friends
        </button>
      </div>

      {getTabUsers().length > 0 ? (
        <div className="user-list-scroll">
          {getTabUsers().map((user) => (
            <div
              key={user.id}
              className="user-item"
              onClick={() =>
                activeTab === "chat" ? handleUserClick(user) : null
              }
            >
              {/* User Name - always shown */}
              <span className="user-name">{user.firstName}</span>

              {/* Show only in Chat Tab */}
              {activeTab === "chat" && (
                <>
                  {/* Show online/offline status */}
                  {Array.isArray(onlineUsers) && onlineUsers.length > 0 ? (
                    onlineUsers.includes(user.id) ? (
                      <span className="online-status"></span>
                    ) : (
                      <span className="offline-status"></span>
                    )
                  ) : user.isActive === 1 ? (
                    <span className="online-status"></span>
                  ) : (
                    <span className="offline-status"></span>
                  )}

                  {/* Typing indicator */}
                  {typingUsers[user.id] && (
                    <span className="typing-indicator">✍️ typing...</span>
                  )}

                  {/* Unread count */}
                  {unreadCounts[user.id] > 0 && (
                    <span className="unread-count">
                      {unreadCounts[user.id]}
                    </span>
                  )}
                </>
              )}

              {/* Show Accept/Reject buttons only in Request tab */}
              {activeTab === "request" && (
                <div className="request-actions flex gap-2">
                  <button
                    className="action-btn accept-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent user click
                      handleAcceptRequest(user.userFriendsId);
                    }}
                    title="Accept Request"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>

                  <button
                    className="action-btn reject-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent user click
                      handleRejectRequest(user.userFriendsId);
                    }}
                    title="Reject Request"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Show "+" button only in Friend tab */}
              {activeTab === "friend" && (
                <>
                  {user.sendRequestFlag === 0 ? (
                    <button
                      className="pending-text connect-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendRequest(user.userId);
                      }}
                      title="Connect"
                      aria-label={`Send friend request to ${user.firstName}`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 5v14m-7-7h14" />
                      </svg>
                      <span>Connect</span>
                    </button>
                  ) : (
                    <span className="pending-text">Pending</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-users">No users in this tab</div>
      )}
    </div>
  );
};

export default UserList;
