const logger = require("../services/logger");

function errorHandler(error, req, res, next) {
  logger.error("Unhandled application error", error);

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid identifier"
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: error.message
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate resource"
    });
  }

  res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error"
  });
}

module.exports = errorHandler;
