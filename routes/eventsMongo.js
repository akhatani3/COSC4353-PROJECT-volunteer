// routes/eventsMongo.js
const express = require('express');
const router = express.Router();
const EventDetails = require('../models/eventdetails'); // Mongoose schema

// GET all events
router.get('/', async (req, res) => {
  try {
    const events = await EventDetails.find().lean();
    // Convert _id to id for Jest compatibility
    const eventsWithId = events.map(e => ({
      ...e,
      id: e._id.toString()
    }));
    res.json(eventsWithId);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});

// POST /add - create new event
router.post('/add', async (req, res) => {
  try {
    const { name, date, location, skillsRequired, urgency, details } = req.body;

    if (!name || !date || !location) {
      return res.status(400).json({ message: 'Name, date, and location are required!' });
    }

    const newEvent = new EventDetails({
      name,
      date,
      location,
      skillsRequired: skillsRequired || [],
      urgency: urgency || 'low',
      details: details || ''
    });

    const savedEvent = await newEvent.save();
    // Add id field for Jest tests
    const eventObj = savedEvent.toObject();
    eventObj.id = savedEvent._id.toString();

    res.status(201).json(eventObj);
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

module.exports = router;
