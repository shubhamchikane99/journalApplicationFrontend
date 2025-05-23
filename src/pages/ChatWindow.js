import React, { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchData } from "../services/apiService";
import { postData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import eventBus from "../utils/eventBus"; // Import eventBus
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import moment from "moment"; // Import Moment.js
//import FileUpload from "../components/FileUpload";
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
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const userId = currentUser.id; // Use user ID directly
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

        //  Mark user as online in
        const markUserOnline = async () => {
          try {
            const userStatus = await fetchData(
              endPoint.chatMessage + `/user-status/${userId}`
            );
            if (userStatus?.data === 0) {
              await fetchData(endPoint.chatMessage + `/${userId}/online`);
            }
          } catch (error) {
            console.error("Error marking user online:", error);
          }
        };
        markUserOnline();

        //selectedUserId To Unread Messages
        eventBus.emit("selectedUsers", {
          selectedUserId: selectedUser?.id,
        });

        // **Immediately call API to mark messages as SEEN**
        fetchData(
          endPoint.chatMessage +
            `/mark-seen/${currentUser.id}/${selectedUser.id}`
        );
        const userPrivateDestination = `/user/${userId}/private`;
        client.subscribe(userPrivateDestination, (message) => {
          const receivedMessage = JSON.parse(message.body);
          //  Only add messages related to the currently selected chat

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
            //  **Mark newly received messages as SEEN instantly**
            if (
              receivedMessage.senderId === selectedUser.id &&
              receivedMessage.receiverId === currentUser.id
            ) {
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === receivedMessage.id
                    ? { ...msg, status: "SEEN" }
                    : msg
                )
              );

              //  **Call API to mark it as seen in DataBase**
              fetchData(
                endPoint.chatMessage +
                  `/mark-seen/${currentUser.id}/${selectedUser.id}`
              );
            }
          } else {
            // console.warn(
            //   "🚨 Message ignored: Not for the current chat window",
            //   receivedMessage
            // );
          }
        });

        client.subscribe(`/user/${userId}/message-delivery`, (message) => {
          const deliveryStatus = JSON.parse(message.body);
          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((msg) => {
              if (
                msg.id === deliveryStatus.id &&
                msg.status !== deliveryStatus.status
              ) {
                return { ...msg, status: deliveryStatus.status };
              }
              return msg;
            });
            return [...updatedMessages];
          });
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
        // 🔴 Mark user as offline in DB
        // fetchData(endPoint.chatMessage`/${userId}/offline`);
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
      stompClient.activate(); // Reconnect the STOMP client if disconnected
    }
  }, [isConnected, stompClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //Typing
  //  Typing function with STOMP connection check
  const handleMessageChange = (event) => {
    setMessage(event.target.value);

    //  Check if STOMP is disconnected before publishing
    if (!stompClient || !stompClient.connected) {
      console.error(
        " STOMP client is not connected! Cannot send typing event."
      );
      return; //  Stop execution if STOMP is not connected
    }

    //  Send "User is typing" event to WebSocket (STOMP)
    stompClient.publish({
      destination: "/app/typing-status",
      body: JSON.stringify({
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        isTyping: true,
      }),
    });

    // Emit typing event globally (UserList will update)
    eventBus.emit("typingStatus", {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      isTyping: true,
    });

    //  Remove typing after 2 seconds of inactivity
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (stompClient && stompClient.connected) {
        //  Notify WebSocket (STOMP) to stop typing
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
          " STOMP client is disconnected! Cannot send stop-typing event."
        );
      }

      //  Emit stop-typing event globally
      eventBus.emit("typingStatus", {
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        isTyping: false,
      });
    }, 2000);
  };

  useEffect(() => {
    if (!stompClient || !isConnected || !selectedUser) return;

    if (stompClient.connected) {
      const subscription = stompClient.subscribe(
        `/user/${currentUser.id}/isTyping`,
        (message) => {
          const typingData = JSON.parse(message.body);

          //  Ensure typing status is only shown for the active chat
          if (selectedUser && typingData.senderId === selectedUser.id) {
            setIsTyping(typingData.isTyping);
          }

          //  Auto-clear typing after 2 seconds
          clearTimeout(typingTimeoutRef.current);
          if (typingData.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 2000);
          }

          //  Emit event to notify UserList.js
          eventBus.emit("typingStatus", {
            senderId: typingData.senderId,
            receiverId: typingData.receiverId,
            isTyping: typingData.isTyping,
          });
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      console.error(" STOMP Client not connected!");
    }
  }, [stompClient, selectedUser, currentUser.id, isConnected]);

  useEffect(() => {
    setIsTyping(false); //  Reset typing indicator when changing chat
  }, [selectedUser]);

  //typing done
  const formatTime = (timestamp) => {
    // Parse the given timestamp with the correct format
    const date = moment(timestamp, "DD-MM-YYYY HH:mm:ss");

    // Format the time in 12-hour format (hh:mm AM/PM)
    return date.format("hh:mm A");
  };

  const sendMessage = async (uploadedFileUrl = null) => {
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

    const messageContent =
      uploadedFileUrl?.url ||
      uploadedFileUrl?.secure_url ||
      (typeof uploadedFileUrl === "string" ? uploadedFileUrl : "") ||
      (typeof message === "string" ? message : "");

    const messageType = message.trim()
      ? "text"
      : uploadedFileUrl
      ? "file"
      : "text";

    if (messageContent.trim() !== "") {
      const chatMessage = {
        senderId: currentUser.id, // Ensure correct sender ID
        receiverId: selectedUser.id, // Ensure correct receiver ID
        content: messageContent, // Use file URL if available,
        type: messageType, // Determine type
        status: "SENT",
        insertDateTime: formattedDate, // Add timestamp
      };

      if (stompClient.connected) {
        // Ensure the connection is active before publishing
        stompClient.publish({
          destination: "/app/private-message",
          body: JSON.stringify(chatMessage),
        });

        //  Ensure message only appends when chat is active
        if (selectedUser.id === chatMessage.receiverId) {
          setMessages((prev) => [...prev, chatMessage]);
        }
        setMessage("");

        try {
          //  Fetch the latest message after sending
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

          //  Update state with the latest message
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

        //  Stop typing immediately when a message is sent
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
    setShowEmojiPicker(true); // Close picker after selecting an emoji
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

  //inputbox
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      sendMessage();
    }
  };

  //FileUpload
  const handleFileChange = async (e) => {
    if (!e || !e.target || !e.target.files || e.target.files.length === 0) {
      console.error("No file selected");
      return;
    }

    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type: file.type });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await postData(
        endPoint.fileUpload + "/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response?.data) {
        sendMessage(response.data, "file");
        setMediaPreview(null);
      }
    } catch (error) {
      console.error("File upload failed:", error);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.startsWith("image")) {
        const blob = item.getAsFile();
        const file = new File([blob], "pasted-image.png", { type: blob.type });

        const fakeEvent = { target: { files: [file] } };
        handleFileChange(fakeEvent);
      }
    }
  };

  return (
    <div className="chat-window">
      {/* 🔥 Show the selected user's name on top */}

      <h3>
        Chat with {selectedUser?.firstName || "Select a user"}
        {selectedUser
          ? Array.isArray(onlineUsers) && onlineUsers.length > 0
            ? onlineUsers.includes(selectedUser.id)
              ? " ✅ (Online)"
              : " ❌ (Offline)"
            : selectedUser.isActive === 1
            ? " ✅ (Online)"
            : " ❌ (Offline)"
          : " ❌ (Offline)"}
      </h3>

      {error && <div className="error-message">{error}</div>}

      {/*  Show typing indicator if the selected user is typing */}
      {isTyping && (
        <p className="typing-indicator">
          {selectedUser?.userName} is typing...
        </p>
      )}

      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.senderId === currentUser.id ? "my-message" : "other-message"
            }
          >
            {/* <b>
              {msg.senderId === currentUser.id ? "You" : selectedUser.userName}:
            </b>{" "} */}
            {msg.type === "file" ? (
              msg.content.endsWith(".mp4") ? (
                <video src={msg.content} width="200" controls />
              ) : (
                <img src={msg.content} width="200" alt="Uploaded" />
              )
            ) : (
              msg.content
            )}
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

      {/*  Message Input Box */}
      <div className="input-box" onPaste={handlePaste}>
        <button
          id="emoji-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          😀
        </button>

        {showEmojiPicker && (
          <div className="emoji-picker" ref={emojiPickerRef}>
            <Picker data={data} onEmojiSelect={addEmoji} />
          </div>
        )}

        <div className="input-container">
          {mediaPreview ? (
            <div className="media-preview">
              {mediaPreview.type.startsWith("video") ? (
                <video src={mediaPreview.url} width="100" controls />
              ) : (
                <img src={mediaPreview.url} width="100" alt="Preview" />
              )}
              <button
                className="remove-media"
                onClick={() => setMediaPreview(null)}
              >
                ✖
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={
                mediaPreview?.url ? `${message} ${mediaPreview.url}` : message
              }
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
            />
          )}
        </div>

        {/* 📸 Image/Video Upload */}
        <button onClick={() => fileInputRef.current.click()}>📎</button>
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button onClick={sendMessage} disabled={!isConnected}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
