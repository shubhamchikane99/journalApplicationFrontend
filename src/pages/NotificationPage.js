import { useState, useEffect, useContext } from "react";
import "../styles/NotificationPage.css";
import Loader from "../components/Loader";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import NavBar from "../components/Navbar"; // <-- import your NavBar here
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setLoggedInUser(user);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!loggedInUser) return;

      setLoading(true);
      setError("");
      try {
        const data = await fetchData(
          `${endPoint.notification}/by-user?userId=${loggedInUser.id}`
        );

        if (data.data) {
          setNotifications(data.data);

          //Update Is Read Status
          await fetchData(
            `${endPoint.notification}/is-read?userId=${loggedInUser.id}`
          );
        }
      } catch (err) {
        setError("Failed to fetch notifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [loggedInUser]);

  function timeAgo(dateTimeString) {
    // Split date and time
    const [datePart, timePart] = dateTimeString.split(" ");
    const [day, month, year] = datePart.split("-");
    const formattedDate = `${year}-${month}-${day}T${timePart}`; // Convert into ISO format

    const now = new Date();
    const createdTime = new Date(formattedDate);
    const diffInSeconds = Math.floor((now - createdTime) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }

  const { logout } = useContext(AuthContext); // Access user and logout
  const navigate = useNavigate(); // For redirection

  const handleLogout = () => {
    logout(); // Clear user data
    navigate("/"); // Redirect to Login page
  };

  return (
    <div>
      <NavBar onLogout={handleLogout} /> {/* <-- Add NavBar at the top */}
      <div className="notification-page">
        <h2>Notifications</h2>
        {error && <p className="error-message">{error}</p>}
        {loading && <Loader />}
        {notifications.length === 0 ? (
          <p>No new notifications...</p>
        ) : (
          <div className="notification-list-container">
            <ul className="notification-list">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`notification-item  ${
                    notif.isRead === 0 ? "selected" : ""
                  }`}
                >
                  {notif.type === 0 && (
                    <p>
                      📬 <strong>{notif.senderName}</strong> sent you a friend
                      request. <em>⏰ {timeAgo(notif.date)}</em>
                      <br />
                      <code style={{ color: "#007bff" }}>
                        🕊️ Waiting for your response
                      </code>
                    </p>
                  )}

                  {notif.type === 1 && (
                    <p>
                      💬 <strong>{notif.senderName}</strong>{" "}
                      {notif.messageCount > 1
                        ? `sent you ${notif.messageCount}+ messages`
                        : `sent you a message`}{" "}
                      <em>⏰ {timeAgo(notif.date)}</em>
                      <br />
                      <code style={{ color: "#28a745" }}>
                        📥 New message received
                      </code>
                    </p>
                  )}

                  {notif.type === 2 && (
                    <p>
                      ✅ <strong>{notif.senderName}</strong> accepted your
                      friend request! 🎉 <em>⏰ {timeAgo(notif.date)}</em>
                      <br />
                      <code style={{ color: "#00c853" }}>
                        🤝 You are now friends
                      </code>
                    </p>
                  )}

                  {notif.type === 3 && (
                    <p>
                      ❌ <strong>{notif.senderName}</strong> rejected your
                      friend request. 😢 <em>⏰ {timeAgo(notif.date)}</em>
                      <br />
                      <code style={{ color: "#e53935" }}>
                        🚫 Request declined
                      </code>
                    </p>
                  )}

                  <span className="notification-time">{notif.time}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPage;
