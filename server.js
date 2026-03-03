require("dotenv").config();

const http = require("http");
const { connectDatabase } = require("./src/config/database");
const { createServer } = require("./src/config/server");
const logger = require("./src/services/logger");
const { seedSuperAdmin } = require("./src/services/seedService");
const { initializeSocketServer } = require("./src/sockets");

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await connectDatabase();
    await seedSuperAdmin();

    const app = createServer();
    const httpServer = http.createServer(app);

    initializeSocketServer(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`HTTP server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start application", error);
    process.exit(1);
  }
}

bootstrap();
