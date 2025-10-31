// routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/UserCredentials");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";

// --- TEST ROUTE ---
router.get("/", (req, res) => {
  res.json({ success: true, message: "Auth route working!" });
});

// --- REGISTER ---
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirm, role } = req.body;

    if (!email || !password || !confirm)
      return res.status(400).json({ success: false, message: "Email, password, and confirmation are required" });

    if (password !== confirm)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "Email already registered" });

    const name = email.split("@")[0];
    const newUser = new User({ email, password, name, role: role || "user" });
    await newUser.save();

    const profile = {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      google: newUser.google,
    };

    res.status(201).json({ success: true, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const profile = {
      email: user.email,
      name: user.name,
      role: user.role,
      google: user.google,
    };

    res.json({ success: true, profile, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

module.exports = router;
