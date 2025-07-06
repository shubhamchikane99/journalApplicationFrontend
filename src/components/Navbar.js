import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { endPoint } from "../services/endPoint";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchData, postData } from "../services/apiService";
import "../styles/NavBar.css";
import Loader from "../components/Loader";
import { FaBell, FaComments, FaBookOpen, FaChartLine } from "react-icons/fa"; // 🔔 Bell Icon

const NavBar = ({ onLogout }) => {
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadNotificatiomCount, setUnreadNotificatiomCount] = useState(0);
  const dashboardPath = `/${loggedInUser.userName
    .trim()
    .toLowerCase()}/dashboard/`;

  let flagForCallingUnreadApi = useRef(0); // useRef instead of simple variable

  const fetchLoginData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Unread message count
  useEffect(() => {
    if (loggedInUser && flagForCallingUnreadApi.current === 0) {
      flagForCallingUnreadApi.current = 1;
      const unreadMessageCount = async () => {
        try {
          const unreadMsg = await fetchData(
            endPoint.chatMessage + "/unread-msg?userId=" + loggedInUser.id
          );

          const unreadNotif = await fetchData(
            endPoint.notification + "/unread-count?userId=" + loggedInUser.id
          );

          setUnreadCount(unreadMsg.data);
          setUnreadNotificatiomCount(unreadNotif.data);
        } catch (err) {
          console.error("Failed to fetch unread messages.");
        }
      };

      unreadMessageCount();
    }
  }, [location.pathname, loggedInUser, flagForCallingUnreadApi]);

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

        //Unread Count update as read on chat tap
        client.subscribe(`/topic/read-msg/${userId}`, (message) => {
          const remainingMsgCount = JSON.parse(message.body);
            setUnreadCount(remainingMsgCount);
        });

        client.subscribe(`/topic/unread-notification/${userId}`, (message) => {
          const notifCount = JSON.parse(message.body);

          setUnreadNotificatiomCount(notifCount);
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
      {loading && <Loader />}
      <div className="nav-links">
        {/* // <Link to="/journal-entry">Journal Entry</Link> */}

        <div className="journal-bell">
          <Link
            to="/journal-entry"
            className={`journal-link ${
              location.pathname === "/journal-entry" ? "active-link" : ""
            }`}
          >
            <FaBookOpen size={18} /> {/* Smaller Bell */}
            <span className="journal-text">Journal Entry</span>
          </Link>
        </div>

        <div className="dashboard-bell">
          <Link
            to={dashboardPath}
            className={`dashboard-link ${
              location.pathname.includes("/dashboard") ? "active-link" : ""
            }`}
          >
            <FaChartLine size={18} /> {/* Smaller Bell */}
            <span className="dashboard-text">Dashboard</span>
          </Link>
        </div>

        <div className="chat-bell">
          <Link
            to="/chat"
            className={`chat-link ${
              location.pathname === "/chat" ? "active-link" : ""
            }`}
          >
            <FaComments size={18} /> {/* Smaller Bell */}
            <span className="chat-text">Chat</span>
            {unreadCount > 0 && (
              <span className="chat-badge">{unreadCount}</span>
            )}
          </Link>
        </div>

        {/* Notification Bell with Text */}
        <div className="notification-bell">
          <Link
            to="/notification"
            className={`notification-link ${
              location.pathname === "/notification" ? "active-link" : ""
            }`}
          >
            <FaBell size={18} /> {/* Smaller Bell */}
            <span className="notification-text">Notification</span>
            {unreadNotificatiomCount > 0 && (
              <span className="notification-badge">
                {unreadNotificatiomCount}
              </span>
            )}
          </Link>
        </div>

        {/* <Link to="/chat">Chat {unreadCount > 0 && `(${unreadCount})`}</Link> */}
        <button className="logout-btn" onClick={fetchLoginData}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
