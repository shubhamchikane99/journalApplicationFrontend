import React, { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import "../styles/ChatWindow.css";

const ChatWindow = ({ selectedUser, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const userId = currentUser.id; // Use user ID directly
    const socket = new SockJS("http://192.168.245.89:8088/ws");

    console.log(`🚀 Connecting to WebSocket as ${currentUser.userName}...`);

    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log("STOMP Debug:", str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`✅ Connected to WebSocket as ${userId}`);
        setIsConnected(true);
        setError(null);

        const userPrivateDestination = `/user/${userId}/private`;
        console.log(`🔗 Subscribing to: ${userPrivateDestination}`);

        client.subscribe(userPrivateDestination, (message) => {
          const receivedMessage = JSON.parse(message.body);
          console.log(`📩 Received private message for ${currentUser.userName}:`, receivedMessage);
          
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
  }, [currentUser, selectedUser]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !currentUser) return;

      try {
        const response = await fetchData(endPoint.chatMessage + `/messages/${currentUser.id}/${selectedUser.id}`
        );

        if (response.error || response.data?.error) {
          setError(response.data?.errorMessage || "Failed to fetch messages.");
          return;
        }

        console.log("Fetched messages:", response.data);
        setMessages(response.data); // Set the messages correctly as an array
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedUser, currentUser]); // Re-fetch when user changes
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        senderId: currentUser.id, // Ensure correct sender ID
        receiverId: selectedUser.id, // Ensure correct receiver ID
        content: message,
      };

      console.log(`📤 Sending message from ${currentUser.userName} to ${selectedUser.userName}:`, chatMessage);

      stompClient.publish({
        destination: "/app/private-message",
        body: JSON.stringify(chatMessage),
      });

      setMessages((prev) => [...prev, chatMessage]);
      setMessage("");
    }
  };

  return (
    <div className="chat-window">
      {/* 🔥 Show the selected user's name on top */}
      <h3>Chat with {selectedUser?.userName || "Select a user"}</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={msg.senderId === currentUser.id ? "my-message" : "other-message"}>
            <b>{msg.senderId === currentUser.id ? "You" : selectedUser.userName}:</b> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-box">
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
        <button onClick={sendMessage} disabled={!isConnected}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
