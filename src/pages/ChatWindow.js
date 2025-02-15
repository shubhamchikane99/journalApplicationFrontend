import React, { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import eventBus from "../utils/eventBus"; // ✅ Import eventBus
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const userId = currentUser.id; // Use user ID directly
    const socket = new SockJS("http://192.168.78.89:8088/ws");
    //const socket = new SockJS("https://journalapplication-production-29f1.up.railway.app/ws");

    console.log(`🚀 Connecting to WebSocket as ${currentUser.userName}...`);

    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log("STOMP Debug:", str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`✅ Connected to WebSocket as ${userId}`);
        setIsConnected(true);
        setError(null);

        // ✅ Mark user as online in
        const markUserOnline = async () => {
          try {
            const userStatus = await fetchData(
              endPoint.chatMessage + `/user-status/${userId}`
            );
            console.log("finalDataIs", JSON.stringify(userStatus?.data));

            if (userStatus?.data === 0) {
              await fetchData(endPoint.chatMessage + `/${userId}/online`);
            }
          } catch (error) {
            console.error("Error marking user online:", error);
          }
        };
        markUserOnline(); // ✅ Call the async function here

        // ✅ Fetch delivered messages
        const fetchDeliveredMessages = async () => {
          try {
            const response = await fetchData(
              endPoint.chatMessage + `/update-delivered-status/${userId}`
            );
            const deliveredMessages = response.data; // Expecting an array

            if (Array.isArray(deliveredMessages)) {
              // Filter messages that belong to the current chat
              const filteredMessages = deliveredMessages.filter(
                (msg) =>
                  (msg.senderId === selectedUser.id &&
                    msg.receiverId === currentUser.id) ||
                  (msg.senderId === currentUser.id &&
                    msg.receiverId === selectedUser.id)
              );

              if (filteredMessages.length > 0) {
                console.log("✅ Updating chat with delivered messages...");

                // Set state properly by merging existing and new messages
                setMessages((prevMessages) => [
                  ...prevMessages,
                  ...filteredMessages,
                ]);
              } else {
                console.log("⚠️ No new messages for this chat.");
              }
            } else {
              console.warn("🚨 Unexpected response format:", deliveredMessages);
            }
          } catch (error) {
            console.error("Error fetching delivered messages:", error);
          }
        };
        fetchDeliveredMessages();

        const userPrivateDestination = `/user/${userId}/private`;
        console.log(`🔗 Subscribing to: ${userPrivateDestination}`);

        client.subscribe(userPrivateDestination, (message) => {
          const receivedMessage = JSON.parse(message.body);

          console.log("Received Messages " + receivedMessage);

          // ✅ Only add messages related to the currently selected chat
          if (
            (receivedMessage.senderId === selectedUser.id &&
              receivedMessage.receiverId === currentUser.id) ||
            (receivedMessage.senderId === currentUser.id &&
              receivedMessage.receiverId === selectedUser.id)
          ) {
            //setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            setMessages((prevMessages) => {
              const isAlreadyInState = prevMessages.some(
                (msg) => msg.id === receivedMessage.id
              );
              return isAlreadyInState
                ? prevMessages
                : [...prevMessages, receivedMessage];
            });
          } else {
            console.warn(
              "🚨 Message ignored: Not for the current chat window",
              receivedMessage
            );
          }
        });

        // ✅ Subscribe to message delivery updates
        const deliveryUpdateDestination = `/user/${userId}/message-delivery`;
        client.subscribe(deliveryUpdateDestination, (message) => {
          const deliveredMessage = JSON.parse(message.body);
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === deliveredMessage.id
                ? { ...msg, status: "DELIVERED" }
                : msg
            )
          );
        });
      },

      onDisconnect: () => {
        console.log("❌ Disconnected from WebSocket");
        setIsConnected(false);
        setError("Disconnected. Reconnecting...");

        // 🔴 Mark user as offline in DB
        fetchData(endPoint.chatMessage`/${userId}/offline`);
      },
      onStompError: (frame) => {
        console.error("❌ STOMP Error:", frame.headers["message"]);
        setError("Server error. Please try again later.");
      },
    });

    client.activate();
    setStompClient(client);

    // 🔴 Detect Tab Close or Refresh (Mark User Offline)
    const handleBeforeUnload = () => {
      fetchData(endPoint.chatMessage + `/${userId}/offline`);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

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

        const filteredMessages = response.data.filter(
          (msg) =>
            (msg.senderId === currentUser.id &&
              msg.receiverId === selectedUser.id) ||
            (msg.senderId === selectedUser.id &&
              msg.receiverId === currentUser.id)
        );
        setMessages(filteredMessages); // Set the messages correctly as an array
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
      stompClient.activate(); // Reconnect the STOMP client if disconnected
    }
  }, [isConnected, stompClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //Typing
  // ✅ Typing function with STOMP connection check
  const handleMessageChange = (event) => {
    setMessage(event.target.value);

    // ❌ Check if STOMP is disconnected before publishing
    if (!stompClient || !stompClient.connected) {
      console.error(
        "❌ STOMP client is not connected! Cannot send typing event."
      );
      return; // ✅ Stop execution if STOMP is not connected
    }

    console.log(`✍️ ${currentUser.userName} is typing...`);

    // ✅ Send "User is typing" event to WebSocket (STOMP)
    stompClient.publish({
      destination: "/app/typing-status",
      body: JSON.stringify({
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        isTyping: true,
      }),
    });

    // ✅ Emit typing event globally (UserList will update)
    eventBus.emit("typingStatus", {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      isTyping: true,
    });

    console.log(`📤 Typing event emitted from ChatWindow.js`, {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      isTyping: true,
    });

    // ✅ Remove typing after 2 seconds of inactivity
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      console.log(`⌛ ${currentUser.userName} stopped typing.`);

      if (stompClient && stompClient.connected) {
        // ✅ Notify WebSocket (STOMP) to stop typing
        stompClient.publish({
          destination: "/app/typing-status",
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: selectedUser.id,
            isTyping: false,
          }),
        });
      } else {
        console.error(
          "❌ STOMP client is disconnected! Cannot send stop-typing event."
        );
      }

      // ✅ Emit stop-typing event globally
      eventBus.emit("typingStatus", {
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        isTyping: false,
      });

      console.log(`📤 Typing event stopped from ChatWindow.js`, {
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        isTyping: false,
      });
    }, 2000);
  };

  useEffect(() => {
    if (!stompClient || !isConnected || !selectedUser) return;

    console.log(`🟢 Subscribing to typing status for user ${currentUser.id}`);

    if (stompClient.connected) {
      const subscription = stompClient.subscribe(
        `/user/${currentUser.id}/isTyping`,
        (message) => {
          const typingData = JSON.parse(message.body);

          // ✅ Ensure typing status is only shown for the active chat
          if (selectedUser && typingData.senderId === selectedUser.id) {
            setIsTyping(typingData.isTyping);
          }

          // ✅ Auto-clear typing after 2 seconds
          clearTimeout(typingTimeoutRef.current);
          if (typingData.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
              console.log(
                `⌛ Typing indicator cleared for ${selectedUser?.id}`
              );
            }, 2000);
          }

          // ✅ Emit event to notify UserList.js
          eventBus.emit("typingStatus", {
            senderId: typingData.senderId,
            receiverId: typingData.receiverId,
            isTyping: typingData.isTyping,
          });
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

  useEffect(() => {
    setIsTyping(false); // ✅ Reset typing indicator when changing chat
  }, [selectedUser]);

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
        status: "SENT",
        insertDateTime: formattedDate, // Add timestamp
      };

      console.log(
        `📤 Sending message from ${currentUser.userName} to ${selectedUser.userName}:`,
        chatMessage
      );

      if (stompClient.connected) {
        // Ensure the connection is active before publishing
        stompClient.publish({
          destination: "/app/private-message",
          body: JSON.stringify(chatMessage),
        });

        // ✅ Ensure message only appends when chat is active
        if (selectedUser.id === chatMessage.receiverId) {
          setMessages((prev) => [...prev, chatMessage]);
        }
        setMessage("");

        try {
          // ✅ Fetch the latest message after sending
          const response = await fetchData(
            endPoint.chatMessage +
              `/messages/${currentUser.id}/${selectedUser.id}`
          );

          if (response.error || response.data?.error) {
            console.error(
              "Error fetching latest message:",
              response.data?.errorMessage
            );
            return;
          }

          // ✅ Update state with the latest message
          const filteredMessages = response.data.filter(
            (msg) =>
              (msg.senderId === currentUser.id &&
                msg.receiverId === selectedUser.id) ||
              (msg.senderId === selectedUser.id &&
                msg.receiverId === currentUser.id)
          );
          setMessages(filteredMessages);
        } catch (error) {
          console.error("Error fetching latest message:", error);
        }

        // ✅ Stop typing immediately when a message is sent
        clearTimeout(typingTimeoutRef.current);

        stompClient.publish({
          destination: "/app/typing-status",
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: selectedUser.id,
            isTyping: false,
          }),
        });

        eventBus.emit("typingStatus", {
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          isTyping: false,
        });
      } else {
        setError("Unable to send message. WebSocket not connected.");
      }
    }
  };

  // Function to handle emoji selection
  const addEmoji = (emoji) => {
    setMessage((prevMessage) => prevMessage + emoji.native);
    setShowEmojiPicker(false); // Close picker after selecting an emoji
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        event.target.id !== "emoji-button"
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="chat-window">
      {/* 🔥 Show the selected user's name on top */}
      <h3>Chat with {selectedUser?.firstName || "Select a user"}</h3>

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
            <div className="message-time">
              {formatTime(msg.insertDateTime)}
              {msg.senderId === currentUser.id && msg.status === "SENT" && " ✓"}
              {msg.senderId === currentUser.id &&
                msg.status === "DELIVERED" &&
                " ✓✓"}
              {msg.senderId === currentUser.id &&
                msg.status === "SEEN" &&
                " 👀"}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-box">
        <div className="input-box">
          {/* Emoji Button */}
          <button
            id="emoji-button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😀
          </button>

          {/* Emoji Picker Component */}
          {showEmojiPicker && (
            <div className="emoji-picker" ref={emojiPickerRef}>
              <Picker data={data} onEmojiSelect={addEmoji} />
            </div>
          )}
        </div>
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
