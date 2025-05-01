import React, { useEffect } from "react";
import "../styles/NotificationPop.css";

const NotificationPop = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification-pop">
      <div className="notification-message">{message}</div>
    </div>
  );
};

export default NotificationPop;
