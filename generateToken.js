const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/dotenv");

/**
 * Generates a signed JWT token for a given user ID.
 *
 * @param {string} userId - The MongoDB _id of the user.
 * @returns {string} Signed JWT token string.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

module.exports = generateToken;
