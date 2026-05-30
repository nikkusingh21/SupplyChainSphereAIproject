require("./config/dotenv"); // Load env vars first
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const forecastRoutes = require("./routes/forecastRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { CLIENT_URL, NODE_ENV } = require("./config/dotenv");
const logger = require("./utils/logger");

const app = express();

// ─── Security Middleware ───────────────────────
app.use(helmet()); // Sets secure HTTP headers

// ─── CORS ──────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Request Logging ───────────────────────────
app.use(morgan(NODE_ENV === "development" ? "dev" : "combined"));

// ─── Body Parsers ──────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Global Rate Limiting ──────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api", globalLimiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});
app.use("/api/auth", authLimiter);

// ─── Health Check Endpoint ─────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    service: "Nexus AI Backend",
    version: "1.0.0",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);

// ─── Error Handling ────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
