const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokenUtils");

exports.handleLogin = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) return null;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user };
};

exports.handleRegister = async (name, email, password) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Validate input
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: email.toLowerCase(), // Normalize email
      password: hashedPassword,
    });

    await user.save();
    console.log("User saved to database:", user._id);

    // Generate tokens (similar to login)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Return the same structure as login
    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

exports.handleSSOLogin = async (myFoodAppToken, email, name) => {
  const jwt = require("jsonwebtoken");

  try {
    // Verify the MyFoodApp token
    const decodedToken = jwt.verify(myFoodAppToken, process.env.ACCESS_SECRET);

    // Verify the token belongs to the provided email
    const tokenUser = await User.findById(decodedToken.id);
    if (!tokenUser || tokenUser.email !== email) {
      throw new Error("Token does not match provided email");
    }

    // Find or create user for grocery app context
    let user = await User.findOne({ email });
    if (!user) {
      // Create user if doesn't exist (auto-registration via SSO)
      user = new User({
        name,
        email: email.toLowerCase(),
        // No password needed for SSO users, or set a random one
        password: await require("bcryptjs").hash(
          Math.random().toString(36),
          10
        ),
      });
      await user.save();
    }

    // Generate new tokens for grocery app context
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid MyFoodApp token");
    } else if (error.name === "TokenExpiredError") {
      throw new Error("MyFoodApp token has expired");
    }
    throw error;
  }
};

exports.refreshTokens = async (token) => {
  const jwt = require("jsonwebtoken");
  const payload = jwt.verify(token, process.env.REFRESH_SECRET);

  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== token) return null;

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
};
