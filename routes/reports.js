// routes/reports.js
const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");
const VolunteerHistory = require("../models/VolunteerHistory");
const UserCredentials = require("../models/UserCredentials");
const UserProfile = require("../models/UserProfile");
const EventDetails = require("../models/eventdetails");

// Generate Volunteer Participation History Report
router.get("/volunteer-history", async (req, res) => {
  try {
    const { format } = req.query; // 'pdf' or 'csv'

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ message: "Format must be 'pdf' or 'csv'" });
    }

    // Fetch all volunteers (users with role='user')
    const volunteers = await UserCredentials.find({ role: 'user' }).select('email name').lean();

    // Fetch all volunteer histories
    const histories = await VolunteerHistory.find().lean();

    // Fetch all events for reference
    const events = await EventDetails.find().lean();
    const eventMap = {};
    events.forEach(e => {
      eventMap[e._id.toString()] = e;
    });

    // Fetch all user profiles for additional info
    const profiles = await UserProfile.find().lean();
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.userEmail] = p;
    });

    // Build report data
    const reportData = [];
    
    for (const volunteer of volunteers) {
      const volunteerHistories = histories.filter(h => h.userId === volunteer.email);
      const profile = profileMap[volunteer.email];

      if (volunteerHistories.length === 0) {
        // Include volunteers with no participation
        reportData.push({
          volunteerName: volunteer.name || volunteer.email,
          volunteerEmail: volunteer.email,
          skills: profile?.skills?.join(', ') || 'N/A',
          totalEvents: 0,
          totalHours: 0,
          events: []
        });
      } else {
        const totalHours = volunteerHistories.reduce((sum, h) => sum + (h.hours || 0), 0);
        const eventDetails = volunteerHistories.map(h => {
          const event = eventMap[h.eventId];
          return {
            eventName: event?.name || 'Unknown Event',
            eventDate: event?.date ? new Date(event.date).toLocaleDateString() : 'N/A',
            role: h.role || 'N/A',
            hours: h.hours || 0,
            status: h.status || 'completed',
            participationDate: new Date(h.participationDate).toLocaleDateString()
          };
        });

        reportData.push({
          volunteerName: volunteer.name || volunteer.email,
          volunteerEmail: volunteer.email,
          skills: profile?.skills?.join(', ') || 'N/A',
          totalEvents: volunteerHistories.length,
          totalHours: totalHours,
          events: eventDetails
        });
      }
    }

    // Generate PDF
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=volunteer-history-report.pdf');
      
      doc.pipe(res);

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Volunteer Participation History Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Report content
      reportData.forEach((volunteer, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(14).font('Helvetica-Bold').text(`${index + 1}. ${volunteer.volunteerName}`, { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Email: ${volunteer.volunteerEmail}`);
        doc.text(`Skills: ${volunteer.skills}`);
        doc.text(`Total Events: ${volunteer.totalEvents}`);
        doc.text(`Total Hours: ${volunteer.totalHours}`);
        doc.moveDown(0.5);

        if (volunteer.events.length > 0) {
          doc.fontSize(11).font('Helvetica-Bold').text('Event Participation:');
          doc.fontSize(9).font('Helvetica');
          
          volunteer.events.forEach((event, i) => {
            doc.text(`  ${i + 1}. ${event.eventName} (${event.eventDate})`);
            doc.text(`     Role: ${event.role} | Hours: ${event.hours} | Status: ${event.status}`);
          });
        } else {
          doc.fontSize(10).font('Helvetica-Oblique').text('No participation history', { indent: 20 });
        }
        
        doc.moveDown(1.5);
      });

      doc.end();
    }

    // Generate CSV
    if (format === 'csv') {
      const flatData = [];
      
      reportData.forEach(volunteer => {
        if (volunteer.events.length === 0) {
          flatData.push({
            'Volunteer Name': volunteer.volunteerName,
            'Volunteer Email': volunteer.volunteerEmail,
            'Skills': volunteer.skills,
            'Total Events': volunteer.totalEvents,
            'Total Hours': volunteer.totalHours,
            'Event Name': 'N/A',
            'Event Date': 'N/A',
            'Role': 'N/A',
            'Hours': 0,
            'Status': 'N/A',
            'Participation Date': 'N/A'
          });
        } else {
          volunteer.events.forEach(event => {
            flatData.push({
              'Volunteer Name': volunteer.volunteerName,
              'Volunteer Email': volunteer.volunteerEmail,
              'Skills': volunteer.skills,
              'Total Events': volunteer.totalEvents,
              'Total Hours': volunteer.totalHours,
              'Event Name': event.eventName,
              'Event Date': event.eventDate,
              'Role': event.role,
              'Hours': event.hours,
              'Status': event.status,
              'Participation Date': event.participationDate
            });
          });
        }
      });

      const parser = new Parser();
      const csv = parser.parse(flatData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=volunteer-history-report.csv');
      res.send(csv);
    }

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

module.exports = router;