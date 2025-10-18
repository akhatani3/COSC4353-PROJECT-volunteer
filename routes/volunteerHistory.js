// routes/volunteerHistory.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const router = express.Router();

const dataDir = path.join(__dirname, "..", "data");
const storeFile = path.join(dataDir, "volunteerHistory.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(storeFile)) fs.writeFileSync(storeFile, "[]");
}
function readAll() {
  ensureStore();
  const raw = fs.readFileSync(storeFile, "utf8") || "[]";
  return JSON.parse(raw);
}
function writeAll(list) {
  fs.writeFileSync(storeFile, JSON.stringify(list, null, 2));
}
function requireFields(fields) {
  return (req, res, next) => {
    for (const f of fields) {
      if (req.body[f] === undefined || req.body[f] === null || req.body[f] === "") {
        return res.status(400).json({ error: `Missing required field: ${f}` });
      }
    }
    next();
  };
}

router.post(
  "/",
  requireFields(["userId", "eventId"]),
  (req, res) => {
    const { userId, eventId, role, hours, status, participationDate } = req.body;
    if (hours !== undefined && (typeof hours !== "number" || hours < 0)) {
      return res.status(400).json({ error: "hours must be a non-negative number" });
    }
    const list = readAll();
    const rec = {
      id: "h_" + randomUUID(),
      userId,
      eventId,
      role: role || null,
      hours: hours ?? 0,
      status: status || "completed",
      participationDate: participationDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(rec);
    writeAll(list);
    res.status(201).json(rec);
  }
);

router.get("/", (req, res) => {
  const { userId, eventId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  let out = readAll().filter(r => r.userId === userId);
  if (eventId) out = out.filter(r => r.eventId === eventId);
  out.sort((a, b) => new Date(b.participationDate) - new Date(a.participationDate));
  res.json(out);
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const allow = ["role", "hours", "status", "participationDate"];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k, v]) => allow.includes(k) && v !== undefined)
  );
  if ("hours" in updates && (typeof updates.hours !== "number" || updates.hours < 0)) {
    return res.status(400).json({ error: "hours must be a non-negative number" });
  }
  const list = readAll();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
  writeAll(list);
  res.json(list[idx]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const list = readAll();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const removed = list.splice(idx, 1)[0];
  writeAll(list);
  res.json(removed);
});

module.exports = router;
