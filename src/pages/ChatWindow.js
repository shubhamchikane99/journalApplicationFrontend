import React, { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import "../styles/ChatWindow.css";

const ChatWindow = ({ selectedUser, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const userId = currentUser.replace(/"/g, ""); // Remove extra quotes if any
  
    const socket = new SockJS("http://192.168.78.89:8088/ws");
    console.log(`🚀 Connecting to WebSocket as ${currentUser}...`);
  
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log("STOMP Debug:", str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`✅ Connected to WebSocket as ${userId}`);
        setIsConnected(true);
        setError(null);
  
        // Subscribe to private messages for the current user
        console.log("Before Recive msg ")
        const userPrivateDestination = `/user/${userId}/private`;
        console.log(`🔗 Subscribing to: ${userPrivateDestination}`);
  
        client.subscribe(`/user/${userId}/private`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log(`📩 Received private message for ${currentUser}:`, receivedMessage);
  
          setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        });
      },
      onDisconnect: () => {
        console.log("❌ Disconnected from WebSocket");
        setIsConnected(false);
        setError("Disconnected. Reconnecting...");
      },
      onStompError: (frame) => {
        console.error("❌ STOMP Error:", frame.headers["message"]);
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
  }, [currentUser]);
  
  const sendMessage = async () => {
    if (!stompClient || !isConnected) {
      setError("Cannot send messages. Server is offline.");
      return;
    }
  
    if (!selectedUser) {
      setError("Please select a user to chat with.");
      return;
    }
  
    if (message.trim() !== "") {
      const chatMessage = {
        senderId: currentUser,
        receiverId: selectedUser,
        content: message,
      };
  
      console.log(`📤 Sending message from ${currentUser} to ${selectedUser}:`, chatMessage);
  
      stompClient.publish({
        destination: "/app/private-message",
        body: JSON.stringify(chatMessage),
      });
  
      setMessages((prev) => [...prev, chatMessage]);
      setMessage("");
    }
  };
  
//----
  return (
    <div className="chat-window">
      <h3>Chat with {selectedUser?.userName || "Select a user"}</h3>

      {/* Show error message if connection fails */}
      {error && <div className="error-message">{error}</div>}

      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={msg.senderId === currentUser ? "my-message" : "other-message"}>
            <b>{msg.senderId}:</b> {msg.content}
          </div>
        ))}
      </div>

      <div className="input-box">
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
        <button onClick={sendMessage} disabled={!isConnected}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
