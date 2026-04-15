import jwt from "jsonwebtoken";

/**
 * Generate JWT token for a user
 * @param {string} userId — MongoDB user _id
 * @returns {string} — signed JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token valid for 30 days
  });
};

export default generateToken;
