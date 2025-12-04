const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    default: ""
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  skillsRequired: {
    type: [String],
    default: []
  },
  urgency: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low"
  },
  date: {
    type: Date,
    required: true
  }
}, { timestamps: true });

const EventDetails = mongoose.models.EventDetails || mongoose.model("EventDetails", eventSchema);

module.exports = EventDetails;
