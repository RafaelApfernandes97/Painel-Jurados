const { verifyToken } = require("../services/jwtService");
const logger = require("../services/logger");

function authMiddleware(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    logger.warn(`[AUTH] Missing token - ${req.method} ${req.originalUrl}`);
    return res.status(401).json({
      message: "Authorization token not provided"
    });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    logger.warn(`[AUTH] Invalid token - ${req.method} ${req.originalUrl}`);
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

module.exports = authMiddleware;
