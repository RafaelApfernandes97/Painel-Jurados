const express = require("express");
const helmet = require("helmet");
const apiRoutes = require("../routes");
const { applyCors } = require("./cors");
const errorHandler = require("../middlewares/errorHandler");
const logger = require("../services/logger");

function createServer() {
  const app = express();

  app.use(helmet());
  app.use(applyCors);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });

  app.use(apiRoutes);

  app.use((req, res, next) => {
    res.status(404).json({
      message: "Route not found"
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = {
  createServer
};
