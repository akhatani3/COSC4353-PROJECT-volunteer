// routes/eventsMongo.js
const express = require('express');
const router = express.Router();
const EventDetails = require('../models/eventdetails'); // Mongoose schema
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

// GET all events
router.get('/', async (req, res) => {
  try {
    const events = await EventDetails.find().lean();
    // Convert _id to id for Jest compatibility
    const eventsWithId = events.map(e => ({
      ...e,
      id: e._id.toString()
    }));
    res.json(eventsWithId);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});

// ========== EXPORT ROUTES - MUST COME BEFORE /:id ROUTES ==========

// GET /preview/csv - Preview events in CSV format (plain text)
router.get('/preview/csv', async (req, res) => {
  try {
    console.log('CSV Preview route hit!');
    const events = await EventDetails.find().sort({ date: 1 });
    console.log('Events found:', events.length);
    
    let csv = 'Event Name,Date,Location,Description,Skills Required,Urgency,Created At\n';
    
    events.forEach(event => {
      console.log('Processing event:', event.name);
      const row = [
        `"${event.name.replace(/"/g, '""')}"`,
        event.date.toISOString().split('T')[0],
        `"${event.location.replace(/"/g, '""')}"`,
        `"${(event.details || '').replace(/"/g, '""')}"`,
        `"${event.skillsRequired.join('; ')}"`,
        event.urgency,
        event.createdAt.toISOString().split('T')[0]
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

// GET /export/csv - Download events as CSV
router.get('/export/csv', async (req, res) => {
  try {
    console.log('CSV Export route hit!');
    const events = await EventDetails.find().sort({ date: 1 });
    
    const tempDir = path.join(__dirname, '..', 'temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const csvFilePath = path.join(tempDir, `events-${Date.now()}.csv`);
    
    const csvWriter = createCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'name', title: 'Event Name' },
        { id: 'date', title: 'Date' },
        { id: 'location', title: 'Location' },
        { id: 'details', title: 'Description' },
        { id: 'skillsRequired', title: 'Skills Required' },
        { id: 'urgency', title: 'Urgency' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });

    const records = events.map(event => ({
      name: event.name,
      date: event.date.toISOString().split('T')[0],
      location: event.location,
      details: event.details,
      skillsRequired: event.skillsRequired.join('; '),
      urgency: event.urgency,
      createdAt: event.createdAt.toISOString().split('T')[0]
    }));

    await csvWriter.writeRecords(records);
    
    res.download(csvFilePath, 'events.csv', (err) => {
      if (err) console.error(err);
      // Clean up temp file
      fs.unlink(csvFilePath, () => {});
    });
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ error: 'Failed to export CSV', details: error.message });
  }
});

// GET /export/pdf - Download events as PDF
router.get('/export/pdf', async (req, res) => {
  try {
    console.log('PDF Export route hit!');
    const events = await EventDetails.find().sort({ date: 1 });
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=events.pdf');
    
    doc.pipe(res);
    
    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('Volunteer Events Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Events
    events.forEach((event, index) => {
      if (index > 0) {
        doc.moveDown(1.5);
        doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);
      }
      
      // Event Name
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#4f46e5').text(event.name);
      doc.moveDown(0.5);
      
      // Date and Urgency
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.text(`Date: ${event.date.toISOString().split('T')[0]}`, { continued: true });
      doc.text(`    Urgency: ${event.urgency.toUpperCase()}`, { align: 'left' });
      doc.moveDown(0.3);
      
      // Location
      doc.text(`Location: ${event.location}`);
      doc.moveDown(0.3);
      
      // Skills
      if (event.skillsRequired.length > 0) {
        doc.text(`Skills Required: ${event.skillsRequired.join(', ')}`);
        doc.moveDown(0.3);
      }
      
      // Description
      if (event.details) {
        doc.fontSize(9).fillColor('#333333');
        doc.text(`Description: ${event.details}`, { width: 500, align: 'justify' });
      }
      
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

// POST /add - create new event
router.post('/add', async (req, res) => {
  try {
    const { name, date, location, skillsRequired, urgency, details } = req.body;
    if (!name || !date || !location) {
      return res.status(400).json({ message: 'Name, date, and location are required!' });
    }
    const newEvent = new EventDetails({
      name,
      date,
      location,
      skillsRequired: skillsRequired || [],
      urgency: urgency || 'low',
      details: details || ''
    });
    const savedEvent = await newEvent.save();
    // Add id field for Jest tests
    const eventObj = savedEvent.toObject();
    eventObj.id = savedEvent._id.toString();
    res.status(201).json(eventObj);
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

// PUT /:id - update existing event
router.put('/:id', async (req, res) => {
  try {
    const { name, date, location, skillsRequired, urgency, details } = req.body;
    const updatedEvent = await EventDetails.findByIdAndUpdate(
      req.params.id,
      { name, date, location, skillsRequired, urgency, details },
      { new: true, runValidators: true }
    );
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const eventObj = updatedEvent.toObject();
    eventObj.id = updatedEvent._id.toString();
    res.json(eventObj);
  } catch (err) {
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
});

// DELETE /:id - delete event
router.delete('/:id', async (req, res) => {
  try {
    const deletedEvent = await EventDetails.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
});

module.exports = router;
