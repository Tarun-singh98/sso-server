const authService = require("../services/authService");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.handleLogin(email, password);
  if (!result) return res.status(401).json({ error: "Invalid credentials" });

  res.json(result);
};

exports.check = async (req, res) => {
  try {
    res.json({ message: "Backend service is running" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.ssoLogin = async (req, res) => {
  try {
    const { myFoodAppToken, email, name } = req.body;

    if (!myFoodAppToken || !email || !name) {
      return res.status(400).json({
        error: "Missing required fields: myFoodAppToken, email, name",
      });
    }

    const result = await authService.handleSSOLogin(
      myFoodAppToken,
      email,
      name
    );
    if (!result) {
      return res.status(401).json({ error: "SSO authentication failed" });
    }

    res.json(result);
  } catch (error) {
    console.error("SSO login error:", error);
    res.status(401).json({
      error: error.message || "SSO authentication failed",
    });
  }
};

exports.verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    const User = require("../models/userModel");
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    console.log("Registration attempt:", { name, email, password: "***" });

    const result = await authService.handleRegister(name, email, password);
    console.log("Registration successful:", result.user.email);

    res.status(201).json(result);
  } catch (error) {
    console.error("Registration failed:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.refresh = async (req, res) => {
  const { token } = req.body;
  try {
    const result = await authService.refreshTokens(token);
    if (!result)
      return res.status(403).json({ error: "Invalid refresh token" });
    res.json(result);
  } catch (e) {
    res.status(403).json({ error: "Token error" });
  }
};

exports.logout = async (req, res) => {
  const { userId } = req.body;
  const User = require("../models/userModel");
  await User.findByIdAndUpdate(userId, { refreshToken: null });
  res.json({ message: "Logged out" });
};
