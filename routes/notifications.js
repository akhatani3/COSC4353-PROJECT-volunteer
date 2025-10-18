// routes/notifications.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const router = express.Router();

const dataDir = path.join(__dirname, "..", "data");
const notificationsFile = path.join(dataDir, "notifications.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(notificationsFile)) fs.writeFileSync(notificationsFile, "[]");
}
function readAll() {
  ensureStore();
  const raw = fs.readFileSync(notificationsFile, "utf8") || "[]";
  return JSON.parse(raw);
}
function writeAll(list) {
  fs.writeFileSync(notificationsFile, JSON.stringify(list, null, 2));
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

router.post("/", requireFields(["userId", "type", "message"]), (req, res) => {
  const { userId, type, message, relatedEventId } = req.body;
  const list = readAll();
  const notif = {
    id: "n_" + randomUUID(),
    userId,
    type,
    message,
    relatedEventId: relatedEventId || null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  list.push(notif);
  writeAll(list);
  res.status(201).json(notif);
});

router.get("/", (req, res) => {
  const { userId, unreadOnly } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  let out = readAll().filter(n => n.userId === userId);
  if (String(unreadOnly) === "true") out = out.filter(n => !n.read);
  out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(out);
});

router.patch("/:id/read", (req, res) => {
  const { id } = req.params;
  const list = readAll();
  const idx = list.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  list[idx].read = true;
  writeAll(list);
  res.json(list[idx]);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const list = readAll();
  const idx = list.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const removed = list.splice(idx, 1)[0];
  writeAll(list);
  res.json(removed);
});

module.exports = router;
