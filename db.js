const mongoose = require("mongoose");
const { MONGO_URI } = require("./dotenv");
const logger = require("../utils/logger");

/**
 * Connects to MongoDB using Mongoose.
 * Exits the process on failure to prevent silent errors.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
