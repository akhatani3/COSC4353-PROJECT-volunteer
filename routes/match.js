// match.js
const express = require('express');
const router = express.Router();  // ✅ this line was missing

// Hard-coded volunteer profiles
const volunteers = [
  { id: 1, name: "Alice", skills: ["teamwork", "organization"], location: "Discovery Green", availability: "weekends" },
  { id: 2, name: "Bob", skills: ["communication", "physical work"], location: "Student Center", availability: "weekdays" },
];

// Hard-coded events (we’ll reuse similar data)
const events = [
  { id: 1, name: "Park Cleanup", location: "Discovery Green", skillsRequired: ["teamwork"], urgency: "medium" },
  { id: 2, name: "Food Drive", location: "Student Center", skillsRequired: ["organization", "communication"], urgency: "high" },
];

// ✅ Match volunteers to events
router.get('/', (req, res) => {
  const matches = [];

  events.forEach(event => {
    const matchedVolunteers = volunteers.filter(volunteer =>
      volunteer.skills.some(skill => event.skillsRequired.includes(skill)) &&
      volunteer.location === event.location
    );

    matches.push({
      event: event.name,
      matchedVolunteers
    });
  });

  res.json(matches);
});

module.exports = router;
