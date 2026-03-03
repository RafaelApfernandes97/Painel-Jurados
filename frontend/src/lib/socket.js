import { io } from "socket.io-client";
import { getToken } from "./storage";

export function createSocket() {
  return io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    transports: ["websocket", "polling"],
    auth: {
      token: getToken()
    }
  });
}
