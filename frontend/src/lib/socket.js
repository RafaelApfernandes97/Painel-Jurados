import { io } from "socket.io-client";
import { getToken } from "./storage";

export function createSocket() {
  return io(import.meta.env.VITE_SOCKET_URL || "https://observation-enlargement-poems-meanwhile.trycloudflare.com ", {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    transports: ["websocket", "polling"],
    auth: {
      token: getToken()
    }
  });
}
