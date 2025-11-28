// routes/volunteerHistory.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const router = express.Router();
const dataDir = path.join(__dirname, "..", "data");
const storeFile = path.join(dataDir, "volunteerHistory.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
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

// ========== EXPORT ROUTES - MUST COME FIRST ==========

// GET /all - Get all volunteer history records (for admin)
router.get("/all", (req, res) => {
  const records = readAll();
  records.sort((a, b) => new Date(b.participationDate) - new Date(a.participationDate));
  res.json(records);
});

// GET /preview/csv - Preview volunteer history in CSV format
router.get('/preview/csv', (req, res) => {
  try {
    console.log('CSV Preview route hit!');
    const records = readAll();
    console.log('Records found:', records.length);
    
    let csv = 'ID,User ID,Event ID,Role,Hours,Status,Participation Date,Created At,Updated At\n';
    
    records.forEach(record => {
      const row = [
        `"${record.id}"`,
        `"${record.userId}"`,
        `"${record.eventId}"`,
        `"${record.role || 'N/A'}"`,
        record.hours,
        record.status,
        new Date(record.participationDate).toISOString().split('T')[0],
        new Date(record.createdAt).toISOString().split('T')[0],
        new Date(record.updatedAt).toISOString().split('T')[0]
      ];
      csv += row.join(',') + '\n';
    });
    
    console.log('Final CSV length:', csv.length);
    res.setHeader('Content-Type', 'text/plain');
    res.send(csv);
  } catch (error) {
    console.error('CSV Preview Error:', error);
    res.status(500).json({ error: 'Failed to preview CSV', details: error.message });
  }
});

// GET /export/csv - Download volunteer history as CSV
router.get('/export/csv', (req, res) => {
  try {
    console.log('CSV Export route hit!');
    const records = readAll();
    
    const tempDir = path.join(__dirname, '..', 'temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const csvFilePath = path.join(tempDir, `volunteer-history-${Date.now()}.csv`);
    
    const csvWriter = createCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'userId', title: 'User ID' },
        { id: 'eventId', title: 'Event ID' },
        { id: 'role', title: 'Role' },
        { id: 'hours', title: 'Hours' },
        { id: 'status', title: 'Status' },
        { id: 'participationDate', title: 'Participation Date' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const csvRecords = records.map(record => ({
      id: record.id,
      userId: record.userId,
      eventId: record.eventId,
      role: record.role || 'N/A',
      hours: record.hours,
      status: record.status,
      participationDate: new Date(record.participationDate).toISOString().split('T')[0],
      createdAt: new Date(record.createdAt).toISOString().split('T')[0],
      updatedAt: new Date(record.updatedAt).toISOString().split('T')[0]
    }));

    csvWriter.writeRecords(csvRecords).then(() => {
      res.download(csvFilePath, 'volunteer-history.csv', (err) => {
        if (err) console.error(err);
        // Clean up temp file
        fs.unlink(csvFilePath, () => {});
      });
    });
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ error: 'Failed to export CSV', details: error.message });
  }
});

// GET /export/pdf - Download volunteer history as PDF
router.get('/export/pdf', (req, res) => {
  try {
    console.log('PDF Export route hit!');
    const records = readAll();
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=volunteer-history.pdf');
    
    doc.pipe(res);
    
    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('Volunteer History Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.fontSize(10).text(`Total Records: ${records.length}`, { align: 'center' });
    doc.moveDown(2);
    
    // Group by status for summary
    const statusCounts = records.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    doc.fontSize(12).font('Helvetica-Bold').text('Summary by Status:');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`  ${status}: ${count} records`);
    });
    doc.moveDown(1.5);
    
    // Records
    doc.fontSize(14).font('Helvetica-Bold').text('Detailed Records');
    doc.moveDown(1);
    
    records.forEach((record, index) => {
      if (index > 0) {
        doc.moveDown(1);
        doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
      }
      
      // Record ID and Status
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#4f46e5').text(`Record: ${record.id}`);
      doc.moveDown(0.3);
      
      // Details
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.text(`User ID: ${record.userId}`, { continued: true });
      doc.text(`    Event ID: ${record.eventId}`);
      doc.text(`Role: ${record.role || 'N/A'}`, { continued: true });
      doc.text(`    Hours: ${record.hours}`);
      doc.text(`Status: ${record.status.toUpperCase()}`, { continued: true });
      doc.text(`    Date: ${new Date(record.participationDate).toLocaleDateString()}`);
      
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }
    });
    
    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#666666');
      doc.text(
        `Page ${i + 1} of ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }
    
    doc.end();
  } catch (error) {
    console.error('PDF Export Error:', error);
    res.status(500).json({ error: 'Failed to export PDF', details: error.message });
  }
});

// ========== END EXPORT ROUTES ==========

// POST / - Create new volunteer history record
router.post("/", requireFields(["userId", "eventId"]), (req, res) => {
  const { userId, eventId, role, hours, status, participationDate } = req.body;
  if (hours !== undefined && (typeof hours !== "number" || hours < 0)) {
    return res.status(400).json({ error: "hours must be a non-negative number" });
  }
  const list = readAll();
  const now = new Date().toISOString();
  const rec = {
    id: "h_" + randomUUID(),
    userId,
    eventId,
    role: role || null,
    hours: hours ?? 0,
    status: status || "completed",
    participationDate: participationDate || now,
    createdAt: now,
    updatedAt: now,
  };
  list.push(rec);
  writeAll(list);
  res.status(201).json(rec);
});

// GET / - Get volunteer history for a specific user
router.get("/", (req, res) => {
  const { userId, eventId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  let out = readAll().filter(r => r.userId === userId);
  if (eventId) out = out.filter(r => r.eventId === eventId);
  out.sort((a, b) => new Date(b.participationDate) - new Date(a.participationDate));
  res.json(out);
});

// PATCH /:id - Update volunteer history record
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

// DELETE /:id - Delete volunteer history record
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
