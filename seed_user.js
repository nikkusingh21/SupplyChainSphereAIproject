const mongoose = require("mongoose");
const path = require("path");
const { MONGO_URI } = require("./src/config/dotenv");
const User = require("./src/models/User");

const seedAdmin = async () => {
  try {
    if (!MONGO_URI) {
      console.error("MONGO_URI not defined in .env file.");
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    const email = "admin@chainsphere.ai";
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User ${email} already exists.`);
      process.exit(0);
    }

    await User.create({
      name: "Admin User",
      email: email,
      password: "password123",
      role: "admin",
      company: "ChainSphere AI"
    });
    console.log("Seeded default admin user:");
    console.log(`Email: ${email}`);
    console.log("Password: password123");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedAdmin();
