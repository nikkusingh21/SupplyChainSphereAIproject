const dotenv = require("dotenv");
const path = require("path");

/**
 * Load environment variables from .env file.
 * Must be called before any other module that relies on process.env.
 */
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PREDICTION_MODEL_URL: process.env.PREDICTION_MODEL_URL,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};
