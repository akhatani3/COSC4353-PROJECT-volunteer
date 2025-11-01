// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connect } = require('./db/mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routers
const eventsRouter = require('./routes/eventsMongo');
const profileRouter = require('./routes/profile');
const volunteerHistoryRouter = require('./routes/volunteerhistory');

// Use routes
app.use('/api/events', eventsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/volunteerhistory', volunteerHistoryRouter);

// Root route
app.get('/', (req, res) => {
  res.status(200).send('Volunteer App API running');
});

// Connect to MongoDB and start server
connect()
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit the app if DB connection fails
  });

module.exports = app;
