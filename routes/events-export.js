const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const EventDetails = require('./eventdetails'); // Adjust path as needed
const path = require('path');
const fs = require('fs');

// GET /api/events/export/csv - Download events as CSV
router.get('/export/csv', async (req, res) => {
  try {
    const events = await EventDetails.find().sort({ date: 1 });
    
    const csvWriter = createCsvWriter({
      path: path.join(__dirname, 'temp', `events-${Date.now()}.csv`),
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
    
    res.download(csvWriter.path, 'events.csv', (err) => {
      if (err) console.error(err);
      // Clean up temp file
      fs.unlink(csvWriter.path, () => {});
    });
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// GET /api/events/export/pdf - Download events as PDF
router.get('/export/pdf', async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// GET /api/events/preview/csv - Preview events in CSV format (plain text)
router.get('/preview/csv', async (req, res) => {
  try {
    const events = await EventDetails.find().sort({ date: 1 });
    
    let csv = 'Event Name,Date,Location,Description,Skills Required,Urgency,Created At\n';
    
    events.forEach(event => {
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
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(csv);
  } catch (error) {
    console.error('CSV Preview Error:', error);
    res.status(500).json({ error: 'Failed to preview CSV' });
  }
});

module.exports = router;
