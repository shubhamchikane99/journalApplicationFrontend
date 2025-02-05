import React, { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import moment from "moment"; // Import Moment.js
import "../styles/ChatWindow.css";

const ChatWindow = ({ selectedUser, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const userId = currentUser.id; // Use user ID directly
    const socket = new SockJS("http://192.168.78.89:8088/ws");

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
          console.log(
            `📩 Received private message for ${currentUser.userName}:`,
            receivedMessage
          );

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
        const response = await fetchData(
          endPoint.chatMessage +
            `/messages/${currentUser.id}/${selectedUser.id}`
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

   // Reconnect logic if the WebSocket connection is lost
   useEffect(() => {
    if (stompClient && !isConnected) {
      console.log("WebSocket connection lost, attempting to reconnect...");
      stompClient.activate();  // Reconnect the STOMP client if disconnected
    }
  }, [isConnected, stompClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //Typing
  const handleMessageChange = (event) => {
    setMessage(event.target.value);

    if (stompClient && isConnected) {
      console.log(`✍️ ${currentUser.userName} is typing...`);
      stompClient.publish({
        destination: "/app/typing-status",
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          isTyping: true, // ✅ Ensure correct property
        }),
      });

      // Reset typing after 2 seconds
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        console.log(`⌛ ${currentUser.userName} stopped typing.`);
        stompClient.publish({
          destination: "/app/typing-status",
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: selectedUser.id,
            isTyping: false,
          }),
        });
      }, 2000);
    }
  };

  useEffect(() => {
    if (!stompClient || !isConnected || !selectedUser) return;

    console.log(`🟢 Subscribing to typing status for user ${currentUser.id}`);

    if (stompClient.connected) {
      const subscription = stompClient.subscribe(
        `/user/${currentUser.id}/isTyping`,
        (message) => {
          const typingData = JSON.parse(message.body);

          if (typingData.senderId === selectedUser.id) {
            setIsTyping(typingData.isTyping); 
          }
        }
      );

      return () => {
        console.log(
          `🔴 Unsubscribing from typing status for user ${currentUser.id}`
        );
        subscription.unsubscribe();
      };
    } else {
      console.error("❌ STOMP Client not connected!");
    }
  }, [stompClient, selectedUser, currentUser.id, isConnected]);

  //typing done

  const formatTime = (timestamp) => {
    // Parse the given timestamp with the correct format
    const date = moment(timestamp, "DD-MM-YYYY HH:mm:ss");

    // Format the time in 12-hour format (hh:mm AM/PM)
    return date.format("hh:mm A");
  };

  const sendMessage = async () => {
    if (!stompClient || !isConnected) {
      setError("Cannot send messages. Server is offline.");
      return;
    }

    if (!selectedUser) {
      setError("Please select a user to chat with.");
      return;
    }

    const formatDate = (isoString) => {
      return moment(isoString).format("YYYY-MM-DD HH:mm:ss"); // Format to required format
    };

    // Example usage
    const currentDateTime = new Date().toISOString(); // Get current timestamp in ISO format
    const formattedDate = formatDate(currentDateTime);

    if (message.trim() !== "") {
      const chatMessage = {
        senderId: currentUser.id, // Ensure correct sender ID
        receiverId: selectedUser.id, // Ensure correct receiver ID
        content: message,
        insertDateTime: formattedDate, // Add timestamp
      };

      console.log(
        `📤 Sending message from ${currentUser.userName} to ${selectedUser.userName}:`,
        chatMessage
      );

      console.log("chatMessage " + JSON.stringify(chatMessage));

      if (stompClient.connected) {
        // Ensure the connection is active before publishing
        stompClient.publish({
          destination: "/app/private-message",
          body: JSON.stringify(chatMessage),
        });

        setMessages((prev) => [...prev, chatMessage]);
        setMessage("");
      } else {
        setError("Unable to send message. WebSocket not connected.");
      }
    }
  };

  return (
    <div className="chat-window">
      {/* 🔥 Show the selected user's name on top */}
      <h3>Chat with {selectedUser?.userName || "Select a user"}</h3>

      {error && <div className="error-message">{error}</div>}
      {/* 🟢 Show typing indicator if the selected user is typing */}
      {isTyping && (
        <>
          {console.log(
            "📝 UI: Showing typing status for",
            selectedUser?.userName
          )}
          <p className="typing-indicator">
            {selectedUser?.userName} is typing...
          </p>
        </>
      )}

      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.senderId === currentUser.id ? "my-message" : "other-message"
            }
          >
            <b>
              {msg.senderId === currentUser.id ? "You" : selectedUser.userName}:
            </b>{" "}
            {msg.content}
            <div className="message-time">{formatTime(msg.insertDateTime)}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-box">
        <input
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} disabled={!isConnected}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
