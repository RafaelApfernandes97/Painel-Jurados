const { verifyToken } = require("../services/jwtService");

function authMiddleware(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    console.warn("[AUTH] Missing or invalid Authorization header", {
      path: req.originalUrl,
      method: req.method,
      authorizationHeader: authorizationHeader ? "present" : "missing"
    });
    return res.status(401).json({
      message: "Authorization token not provided"
    });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    req.user = verifyToken(token);
    console.info("[AUTH] Token verified", {
      path: req.originalUrl,
      method: req.method,
      user: req.user
    });
    next();
  } catch (error) {
    console.warn("[AUTH] Invalid or expired token", {
      path: req.originalUrl,
      method: req.method,
      error: error.message
    });
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

module.exports = authMiddleware;
