const { mongoose } = require("../db/mongoose");

const UserProfileSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    state: { type: String },
    zipcode: { type: String },
    skills: { type: [String], default: [] },
    preferences: { type: [String], default: [] },
    availability: { type: [String], default: [] },
  },
  { timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", UserProfileSchema);
module.exports = UserProfile;
