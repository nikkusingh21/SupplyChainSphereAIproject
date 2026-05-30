const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/dotenv");

// ──────────────────────────────────────────────
// Middleware: Protect routes — requires valid JWT
// ──────────────────────────────────────────────
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      res.status(401);
      throw new Error("User belonging to this token no longer exists.");
    }

    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized. Token is invalid or expired.");
  }
});

// ──────────────────────────────────────────────
// Middleware: Restrict access to specific roles
// Usage: authorize("admin", "manager")
// ──────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' is not authorized to access this resource.`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
