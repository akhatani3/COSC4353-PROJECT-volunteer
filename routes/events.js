// events.js
const express = require('express');
const router = express.Router();

// Hard-coded events for now (since no DB)
let events = [
  {
    id: 1,
    name: "Park Cleanup",
    date: "2025-10-12",
    location: "Discovery Green",
    skillsRequired: ["teamwork", "physical work"],
    urgency: "medium",
    details: "Join us to keep the park clean and beautiful!"
  },
  {
    id: 2,
    name: "Food Drive",
    date: "2025-10-20",
    location: "Student Center",
    skillsRequired: ["organization", "communication"],
    urgency: "high",
    details: "Help collect and organize donations for families in need."
  }
];

// ✅ Get all events
router.get('/', (req, res) => {
  res.json(events);
});

// ✅ Create new event
router.post('/add', (req, res) => {
  const { name, date, location, skillsRequired, urgency, details } = req.body;

  // Simple validation
  if (!name || !date || !location) {
    return res.status(400).json({ message: "Name, date, and location are required!" });
  }

  const newEvent = {
    id: events.length + 1,
    name,
    date,
    location,
    skillsRequired: skillsRequired || [],
    urgency: urgency || "low",
    details: details || ""
  };

  events.push(newEvent);
  res.status(201).json(newEvent);
});

module.exports = router;
