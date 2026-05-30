const app = require("./app");
const connectDB = require("./config/db");
const { PORT, NODE_ENV } = require("./config/dotenv");
const logger = require("./utils/logger");

// ─── Connect to DB then start server ──────────
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Nexus AI Backend running in ${NODE_ENV} mode on port ${PORT}`);
    logger.info(`📡 API base URL: http://localhost:${PORT}/api`);
    logger.info(`❤️  Health check: http://localhost:${PORT}/api/health`);
  });

  // ─── Graceful Shutdown ────────────────────
  const shutdown = (signal) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
    // Force exit after 10s if connections remain open
    setTimeout(() => {
      logger.error("Forcefully shutting down after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ─── Unhandled Rejections ─────────────────
  process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}\nReason: ${reason}`);
    server.close(() => process.exit(1));
  });
};

startServer();
