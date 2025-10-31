const { mongoose } = require("../db/mongoose");

const VolunteerHistorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    role: { type: String },
    hours: { type: Number, default: 0 },
    status: { type: String, default: "completed" },
    participationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const VolunteerHistory = mongoose.model("VolunteerHistory", VolunteerHistorySchema);
module.exports = VolunteerHistory;
