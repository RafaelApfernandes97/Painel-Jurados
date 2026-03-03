const { Server } = require("socket.io");
const { isAllowedOrigin } = require("../config/cors");
const logger = require("../services/logger");
const { dispatchCurrentChoreography } = require("../services/currentChoreographyService");
const { verifyToken } = require("../services/jwtService");
const { getEventRoom, setIo } = require("../services/socketService");

function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by Socket.IO CORS"));
      },
      methods: ["GET", "POST"]
    }
  });

  setIo(io);

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("JOIN_EVENT", ({ eventId } = {}) => {
      if (!eventId) {
        socket.emit("SOCKET_ERROR", {
          message: "eventId is required"
        });
        return;
      }

      socket.join(getEventRoom(eventId));
      logger.info(`Socket ${socket.id} joined event room ${eventId}`);
    });

    socket.on("CALL_CHOREOGRAPHY", async (payload = {}, acknowledgement) => {
      try {
        const token = payload.token || socket.handshake.auth?.token;

        if (!token) {
          throw createSocketError("Authorization token not provided", 401);
        }

        const user = verifyToken(token);

        if (user.role !== "admin" || !user.clientId) {
          throw createSocketError("Forbidden", 403);
        }

        if (!payload.eventId || !payload.choreographyId) {
          throw createSocketError("eventId and choreographyId are required", 400);
        }

        const currentChoreography = await dispatchCurrentChoreography({
          eventId: payload.eventId,
          choreographyId: payload.choreographyId,
          clientId: user.clientId
        });

        if (typeof acknowledgement === "function") {
          acknowledgement({
            success: true,
            data: currentChoreography
          });
        }
      } catch (error) {
        logger.error("CALL_CHOREOGRAPHY failed", error);

        if (typeof acknowledgement === "function") {
          acknowledgement({
            success: false,
            message: error.message || "Unable to call choreography"
          });
        } else {
          socket.emit("SOCKET_ERROR", {
            message: error.message || "Unable to call choreography"
          });
        }
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function createSocketError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = {
  initializeSocketServer
};
