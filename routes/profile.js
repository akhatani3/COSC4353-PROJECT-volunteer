// routes/profile.js
const express = require("express");
const UserProfile = require("../models/UserProfile");
const router = express.Router();

// --- Mongo-backed profile API ---
router.get("/", async (_req, res) => {
  const all = await UserProfile.find({}).lean();
  res.json(all);
});

router.get("/:email", async (req, res) => {
  const email = String(req.params.email || "").toLowerCase();
  const p = await UserProfile.findOne({ userEmail: email }).lean();
  if (!p) return res.status(404).json({ error: "Profile not found" });
  res.json(p);
});

router.post("/", async (req, res) => {
  try {
    const p = new UserProfile(req.body);
    await p.validate();
    await p.save();
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/:email", async (req, res) => {
  try {
    const email = String(req.params.email || "").toLowerCase();
    const p = await UserProfile.findOneAndUpdate(
      { userEmail: email },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!p) return res.status(404).json({ error: "Profile not found" });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- Test-only front-end style API (pure JS, for unit tests) ---
const STATES = [
  {code:'AL',name:'Alabama'},{code:'AK',name:'Alaska'},{code:'AZ',name:'Arizona'},
  {code:'AR',name:'Arkansas'},{code:'CA',name:'California'},{code:'CO',name:'Colorado'},
  {code:'CT',name:'Connecticut'},{code:'DE',name:'Delaware'},{code:'FL',name:'Florida'},
  {code:'GA',name:'Georgia'},{code:'HI',name:'Hawaii'},{code:'ID',name:'Idaho'},
  {code:'IL',name:'Illinois'},{code:'IN',name:'Indiana'},{code:'IA',name:'Iowa'},
  {code:'KS',name:'Kansas'},{code:'KY',name:'Kentucky'},{code:'LA',name:'Louisiana'},
  {code:'ME',name:'Maine'},{code:'MD',name:'Maryland'},{code:'MA',name:'Massachusetts'},
  {code:'MI',name:'Michigan'},{code:'MN',name:'Minnesota'},{code:'MS',name:'Mississippi'},
  {code:'MO',name:'Missouri'},{code:'MT',name:'Montana'},{code:'NE',name:'Nebraska'},
  {code:'NV',name:'Nevada'},{code:'NH',name:'New Hampshire'},{code:'NJ',name:'New Jersey'},
  {code:'NM',name:'New Mexico'},{code:'NY',name:'New York'},{code:'NC',name:'North Carolina'},
  {code:'ND',name:'North Dakota'},{code:'OH',name:'Ohio'},{code:'OK',name:'Oklahoma'},
  {code:'OR',name:'Oregon'},{code:'PA',name:'Pennsylvania'},{code:'RI',name:'Rhode Island'},
  {code:'SC',name:'South Carolina'},{code:'SD',name:'South Dakota'},{code:'TN',name:'Tennessee'},
  {code:'TX',name:'Texas'},{code:'UT',name:'Utah'},{code:'VT',name:'Vermont'},
  {code:'VA',name:'Virginia'},{code:'WA',name:'Washington'},{code:'WV',name:'West Virginia'},
  {code:'WI',name:'Wisconsin'},{code:'WY',name:'Wyoming'}
];

const SKILLS = [
  'First Aid','CPR','Food Service','Logistics','Child Care','Tutoring','Admin','Drivers','Medical','Translation'
];

// pure in-memory store for tests (no localStorage)
const _mem = {
  users: [{ email: 'john@example.com', name: 'John Doe', profile: { fullName: 'John Doe', availability: [] } }],
  currentUser: { email: 'john@example.com' }
};

function _getUsers() { return _mem.users; }
function _saveUsers(users) { _mem.users = users; }

const ProfileAPI = {
  getCurrentUser() { return _mem.currentUser || null; },
  getStates() { return STATES; },
  getSkills() { return SKILLS; },
  getUserProfile(email) {
    const users = _getUsers();
    return users.find(u => u.email === email) || null;
  },
  updateUserProfile(email, profile) {
    const users = _getUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) return false;
    users[idx].profile = profile;
    users[idx].name = profile.fullName;
    _saveUsers(users);
    return true;
  },
  addAvailability(email, date) {
    const users = _getUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) return [];
    users[idx].profile = users[idx].profile || {};
    users[idx].profile.availability = users[idx].profile.availability || [];
    if (!users[idx].profile.availability.includes(date)) users[idx].profile.availability.push(date);
    _saveUsers(users);
    return [...users[idx].profile.availability];
  },
  removeAvailability(email, date) {
    const users = _getUsers();
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) return [];
    users[idx].profile = users[idx].profile || {};
    users[idx].profile.availability = users[idx].profile.availability || [];
    users[idx].profile.availability = users[idx].profile.availability.filter(d => d !== date);
    _saveUsers(users);
    return [...users[idx].profile.availability];
  }
};

module.exports = { router, ProfileAPI };