const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateRegister,
  validateLogin,
} = require("../middleware/validateMiddleware");

// Public Routes
router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);

// Private Routes (require valid JWT)
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
