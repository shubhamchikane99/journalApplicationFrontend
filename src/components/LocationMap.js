import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/LocationMap.css";

// Fix leaflet marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Auto-update map center when position changes
const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true, duration: 1 });
    }
  }, [position, map]);
  return null;
};

// ─── LocationMessage ─── shown in chat when receiving a location
export const LocationMessage = ({ content }) => {
  let location;
  try {
    location = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    return <div className="loc-error">Invalid location data</div>;
  }

  const position = [location.lat, location.lng];

  return (
    <div className="loc-message-card">
      {/* Optional message text */}
      {location.message && (
        <div className="loc-user-message">{location.message}</div>
      )}

      {location.isLive && (
        <div className="loc-live-badge">
          <span className="loc-live-dot" />
          LIVE LOCATION
        </div>
      )}

      <MapContainer
        center={position}
        zoom={15}
        style={{ height: "180px", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={false}
        dragging={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position}>
          <Popup>📍 Location</Popup>
        </Marker>
        <MapUpdater position={position} />
      </MapContainer>

      <div className="loc-message-footer">
        <span className="loc-coords">
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </span>
        <a
          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
          target="_blank"
          rel="noreferrer"
          className="loc-open-btn"
        >
          Open in Maps ↗
        </a>
      </div>
    </div>
  );
};

// ─── LocationShare ─── button + popup to share location
const LocationShare = ({ stompClient, currentUser, selectedUser, onSend }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [location, setLocation] = useState(null);
  const [extraMsg, setExtraMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLocationClick = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isLive: false,
        });
        setLoading(false);
        setShowPopup(true);
      },
      (err) => {
        setError("Location access denied");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSend = () => {
    if (!location) {
      console.error("No location data");
      return;
    }
    if (!stompClient || !stompClient.connected) {
      console.error("STOMP not connected");
      return;
    }

    const locationData = {
      lat: location.lat,
      lng: location.lng,
      isLive: true,
      message: extraMsg.trim() || null,
    };

    // Format date same as ChatWindow sendMessage
    const now = new Date();
    const insertDateTime =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0") +
      " " +
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    const chatMessage = {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content: JSON.stringify(locationData),
      type: "location",
      status: 0,
      isEdited: 0,
      isDelete: 0,
      replyToMessageId: null,
      insertDateTime: insertDateTime,
    };

    console.log("Sending location message:", chatMessage);

    stompClient.publish({
      destination: "/app/private-message",
      body: JSON.stringify(chatMessage),
    });

    if (onSend) {
      onSend(chatMessage.content);
    }

    // reset
    setShowPopup(false);
    setExtraMsg("");
    setLocation(null);
  };

  const handleClose = () => {
    setShowPopup(false);
    setLocation(null);
    setExtraMsg("");
    setError(null);
  };

  return (
    <>
      {/* 📍 Button */}
      <button
        className="loc-share-btn"
        onClick={handleLocationClick}
        title="Share location"
        disabled={loading}
      >
        {loading ? "⏳" : "📍"}
      </button>

      {error && <div style={{ color: "red", fontSize: "12px" }}>{error}</div>}

      {/* Popup */}
      {showPopup && location && (
        <div className="loc-popup-backdrop">
          <div className="loc-popup">
            <div className="loc-popup-header">
              <span style={{ fontWeight: 500, fontSize: "15px" }}>
                Share Location
              </span>
              <button className="loc-close-btn" onClick={handleClose}>
                ✕
              </button>
            </div>

            {/* Map preview */}
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={15}
              style={{
                height: "200px",
                width: "100%",
                borderRadius: "8px",
              }}
              zoomControl={true}
              scrollWheelZoom={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[location.lat, location.lng]}>
                <Popup>Your location</Popup>
              </Marker>
            </MapContainer>

            {/* Coordinates */}
            <div className="loc-popup-coords">
              📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </div>

            {/* Optional message input */}
            <input
              type="text"
              className="loc-popup-input"
              placeholder="Add a message (optional)..."
              value={extraMsg}
              onChange={(e) => setExtraMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />

            {/* Action buttons */}
            <div className="loc-popup-actions">
              <button className="loc-cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button className="loc-send-btn" onClick={handleSend}>
                Send Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocationShare;
