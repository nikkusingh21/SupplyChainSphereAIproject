const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "manager", "analyst", "viewer"],
      default: "analyst",
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ----- Pre-save hook: Hash password before saving -----
userSchema.pre("save", async function (next) {
  // Only hash if password was modified
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ----- Instance method: Compare entered password with stored hash -----
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ----- Transform: Remove sensitive fields from JSON output -----
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
