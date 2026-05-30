const logger = require("../utils/logger");
const { NODE_ENV } = require("../config/dotenv");

// ──────────────────────────────────────────────
// Middleware: Global error handler
// Must be registered LAST in Express app (after all routes)
// ──────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Internal Server Error";

  // Mongoose: Document not found (CastError on invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found.";
  }

  // Mongoose: Duplicate key violation
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue).join(", ");
    message = `A record with this ${field} already exists.`;
  }

  // Mongoose: Validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(". ");
  }

  // JWT: Invalid / Expired token
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  }

  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
};

// ──────────────────────────────────────────────
// Middleware: 404 Not Found handler
// Register AFTER all routes, BEFORE errorHandler
// ──────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
