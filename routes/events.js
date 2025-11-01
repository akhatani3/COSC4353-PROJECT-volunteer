// routes/events.js
const express = require('express');
const router = express.Router();
const EventDetails = require('../models/eventdetails');

// ✅ Get all events
router.get('/', async (req, res) => {
  try {
    const events = await EventDetails.find({});
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Create new event
router.post('/add', async (req, res) => {
  const { name, details, location, skillsRequired, urgency, date } = req.body;

  // Validation
  if (!name || !location || !date) {
    return res.status(400).json({ message: "Name, location, and date are required" });
  }

  try {
    const event = new EventDetails({
      name,
      details,
      location,
      skillsRequired: skillsRequired || [],
      urgency: urgency || "low",
      date
    });

    await event.save(); // save to MongoDB
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
