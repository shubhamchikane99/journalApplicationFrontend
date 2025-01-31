import { Client } from "@stomp/stompjs";

const socketClient = new Client({
  brokerURL: "ws://localhost:8080/ws",
  onConnect: () => console.log("Connected to WebSocket"),
});

export default socketClient;
