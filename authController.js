const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendWelcomeEmail } = require("../services/emailService");
const logger = require("../utils/logger");

// ──────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ──────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, company } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists.");
  }

  // Create user (password is hashed via pre-save hook in model)
  const user = await User.create({ name, email, password, company });

  // Send welcome email (non-blocking - don't fail registration if email fails)
  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (emailErr) {
    logger.warn(`Welcome email failed for ${user.email}: ${emailErr.message}`);
  }

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
    },
  });
});

// ──────────────────────────────────────────────
// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
// ──────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Fetch user with password field (select: false by default)
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Contact support.");
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Login successful.",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      lastLogin: user.lastLogin,
    },
  });
});

// ──────────────────────────────────────────────
// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
// ──────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by authMiddleware
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }
  res.json({ success: true, user });
});

// ──────────────────────────────────────────────
// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
// ──────────────────────────────────────────────
const updateMe = asyncHandler(async (req, res) => {
  const { name, company } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, company },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
});

// ──────────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ──────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password changed successfully." });
});

module.exports = { registerUser, loginUser, getMe, updateMe, changePassword };
