import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { endPoint } from "../services/endPoint";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchData, postData } from "../services/apiService";
import "../styles/NavBar.css";

const NavBar = ({ onLogout }) => {
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoginData = async () => {
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

  // Unread message count
  useEffect(() => {
    if (loggedInUser) {
      const unreadMessageCount = async () => {
        try {
          const data = await fetchData(
            endPoint.chatMessage + "/unread-msg?userId=" + loggedInUser.id
          );
          setUnreadCount(data.data);
        } catch (err) {
          console.error("Failed to fetch unread messages.");
        }
      };

      unreadMessageCount();
    }
  }, [location.pathname, loggedInUser]);

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

      onConnect: () => {
        setIsConnected(true);
        setError(null);

        client.subscribe(`/topic/unread-msg/${userId}`, (message) => {
          if (message.body === userId) {
            setUnreadCount((prevCount) => prevCount + 1);
          }
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
  }, [loggedInUser.id]);

  // Check if STOMP is disconnected before publishing
  useEffect(() => {
    if (stompClient && !isConnected) {
      stompClient.activate();
    } else if (error) {
    }
  }, [isConnected, stompClient, error]);

  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/journal-entry">Journal Entry</Link>
        <Link to="/chat">Chat {unreadCount > 0 && `(${unreadCount})`}</Link>
        <Link to="/tic-tac-toe">Tic Tac Toe</Link>
      </div>
      <button className="logout-btn" onClick={fetchLoginData}>
        Logout
      </button>
    </nav>
  );
};

export default NavBar;
