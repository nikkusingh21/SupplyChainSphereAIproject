const winston = require("winston");
const { NODE_ENV } = require("../config/dotenv");

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

// Clean JSON format for production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: NODE_ENV === "development" ? "debug" : "info",
  format: NODE_ENV === "development" ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    // In production, also write to log files
    ...(NODE_ENV === "production"
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
  exceptionHandlers: [new winston.transports.Console()],
});

module.exports = logger;
