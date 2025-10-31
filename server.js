// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");

// NEW: load env + mongo connector
require("dotenv").config();
const { connect } = require("./db/mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend files

// --- FILE PATHS ---
const dataDir = path.join(__dirname, "data");
const eventsFile = path.join(dataDir, "events.json");
const volunteersFile = path.join(dataDir, "volunteers.json");

// --- ENSURE DATA FILES EXIST ---
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(eventsFile)) fs.writeFileSync(eventsFile, "[]");
if (!fs.existsSync(volunteersFile)) fs.writeFileSync(volunteersFile, "[]");

// --- ROUTES ---
const eventsRouter = require("./routes/events");
const matchRouter = require("./routes/match");
const authRouter = require("./routes/auth");
const { router: profileRouter } = require("./routes/profile"); 
const notificationsRouter = require("./routes/notifications");
const volunteerHistoryRouter = require("./routes/volunteerHistory"); 

// Use the route files
app.use("/api/events", eventsRouter);
app.use("/api/match", matchRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/volunteer-history", volunteerHistoryRouter);

// Export app for tests
module.exports = app;

if (require.main === module) {
  (async () => {
    await connect(); 
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })();
}
