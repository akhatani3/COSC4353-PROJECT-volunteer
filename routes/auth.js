// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Secret key for JWT (demo purposes)
const JWT_SECRET = "your_secret_key_here";

// Hard-coded users array
const users = [
  {
    id: 1,
    email: "john@example.com",
    password: "password123",
    name: "John Doe",
    role: "user",
    google: false
  },
  {
    id: 2,
    email: "admin@example.com",
    password: "adminpass",
    name: "Admin User",
    role: "admin",
    google: false
  }
];

// Simple GET test route
router.get('/', (req, res) => {
  res.json({ success: true, message: "Auth route working!" });
});

// POST /login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = users.find(u => u.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  res.json({
    success: true,
    profile: { email: user.email, name: user.name, role: user.role, google: user.google },
    token
  });
});

// POST /register
router.post('/register', (req, res) => {
  const { email, password, confirm, role } = req.body;

  // Check all required fields
  if (!email || !password || !confirm) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and confirmation are required'
    });
  }

  // Check password confirmation
  if (password !== confirm) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  // Check duplicate email
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email is already registered.' });
  }

  // Create new user
  const newUser = {
    id: users.length + 1,
    email,
    password,
    name: email.split('@')[0],
    google: false,
    role: role || 'user'
  };

  users.push(newUser);

  // Return profile only (without password)
  const profile = {
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    google: newUser.google
  };

  return res.status(201).json({ success: true, profile });
});


module.exports = router;
