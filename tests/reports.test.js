// tests/reports.test.js
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const reportsRoutes = require("../routes/reports");
const UserCredentials = require("../models/UserCredentials");
const UserProfile = require("../models/UserProfile");
const EventDetails = require("../models/eventdetails");
const VolunteerHistory = require("../models/VolunteerHistory");

let mongoServer;
let app;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {});

  // Setup Express app
  app = express();
  app.use(express.json());
  app.use("/api/reports", reportsRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear database after each test
  await UserCredentials.deleteMany({});
  await UserProfile.deleteMany({});
  await EventDetails.deleteMany({});
  await VolunteerHistory.deleteMany({});
});

describe("Reports Routes - Volunteer History", () => {
  // Helper function to create test data
  async function createTestData() {
    // Create volunteers
    const volunteer1 = await UserCredentials.create({
      email: "volunteer1@test.com",
      password: "password123",
      name: "John Doe",
      role: "user"
    });

    const volunteer2 = await UserCredentials.create({
      email: "volunteer2@test.com",
      password: "password123",
      name: "Jane Smith",
      role: "user"
    });

    // Create admin (should not appear in report)
    await UserCredentials.create({
      email: "admin@test.com",
      password: "password123",
      name: "Admin User",
      role: "admin"
    });

    // Create profiles
    await UserProfile.create({
      userEmail: "volunteer1@test.com",
      fullName: "John Doe",
      skills: ["teamwork", "leadership"],
      state: "TX",
      zipcode: "77002"
    });

    await UserProfile.create({
      userEmail: "volunteer2@test.com",
      fullName: "Jane Smith",
      skills: ["communication", "organization"],
      state: "TX",
      zipcode: "77003"
    });

    // Create events
    const event1 = await EventDetails.create({
      name: "Park Cleanup",
      date: new Date("2025-12-01"),
      location: "Discovery Green",
      skillsRequired: ["teamwork"],
      urgency: "medium",
      details: "Community park cleanup event"
    });

    const event2 = await EventDetails.create({
      name: "Food Drive",
      date: new Date("2025-12-15"),
      location: "Student Center",
      skillsRequired: ["organization", "communication"],
      urgency: "high",
      details: "Holiday food drive"
    });

    // Create volunteer history
    await VolunteerHistory.create({
      userId: "volunteer1@test.com",
      eventId: event1._id.toString(),
      role: "Team Leader",
      hours: 4,
      status: "completed",
      participationDate: new Date("2025-12-01")
    });

    await VolunteerHistory.create({
      userId: "volunteer1@test.com",
      eventId: event2._id.toString(),
      role: "Volunteer",
      hours: 3,
      status: "completed",
      participationDate: new Date("2025-12-15")
    });

    await VolunteerHistory.create({
      userId: "volunteer2@test.com",
      eventId: event2._id.toString(),
      role: "Organizer",
      hours: 5,
      status: "completed",
      participationDate: new Date("2025-12-15")
    });

    return { volunteer1, volunteer2, event1, event2 };
  }

  // TEST: Missing format parameter
  test("GET /api/reports/volunteer-history without format should return 400", async () => {
    const res = await request(app).get("/api/reports/volunteer-history");
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Format must be 'pdf' or 'csv'");
  });

  // TEST: Invalid format parameter
  test("GET /api/reports/volunteer-history with invalid format should return 400", async () => {
    const res = await request(app).get("/api/reports/volunteer-history?format=json");
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Format must be 'pdf' or 'csv'");
  });

  // TEST: PDF generation with data
  test("GET /api/reports/volunteer-history with format=pdf should return PDF", async () => {
    await createTestData();

    const res = await request(app).get("/api/reports/volunteer-history?format=pdf");
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('volunteer-history-report.pdf');
    expect(res.body).toBeDefined();
  });

  // TEST: CSV generation with data
  test("GET /api/reports/volunteer-history with format=csv should return CSV", async () => {
    await createTestData();

    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toContain('volunteer-history-report.csv');
    expect(res.text).toContain('Volunteer Name');
    expect(res.text).toContain('Volunteer Email');
    expect(res.text).toContain('John Doe');
    expect(res.text).toContain('Jane Smith');
  });

  // TEST: CSV content validation
  test("CSV report should contain correct volunteer data", async () => {
    await createTestData();

    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    
    const csvContent = res.text;
    expect(csvContent).toContain('volunteer1@test.com');
    expect(csvContent).toContain('volunteer2@test.com');
    expect(csvContent).toContain('Park Cleanup');
    expect(csvContent).toContain('Food Drive');
    expect(csvContent).toContain('Team Leader');
    expect(csvContent).toContain('Organizer');
  });

  // TEST: Volunteers with no history should be included
  test("Report should include volunteers with no participation history", async () => {
    // Create volunteer with no history
    await UserCredentials.create({
      email: "newvolunteer@test.com",
      password: "password123",
      name: "New Volunteer",
      role: "user"
    });

    await UserProfile.create({
      userEmail: "newvolunteer@test.com",
      fullName: "New Volunteer",
      skills: ["coding"],
      state: "TX",
      zipcode: "77004"
    });

    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('newvolunteer@test.com');
    expect(res.text).toContain('New Volunteer');
    expect(res.text).toContain('0'); // Total events should be 0
  });

  // TEST: Admin users should not appear in report
  test("Report should not include admin users", async () => {
    await UserCredentials.create({
      email: "admin@test.com",
      password: "password123",
      name: "Admin User",
      role: "admin"
    });

    await UserCredentials.create({
      email: "volunteer@test.com",
      password: "password123",
      name: "Regular Volunteer",
      role: "user"
    });

    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).not.toContain('admin@test.com');
    expect(res.text).toContain('volunteer@test.com');
  });

  // TEST: Empty database should return empty report
  test("Report with no volunteers should succeed", async () => {
    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
  });

  // TEST: Volunteer without profile should still appear
  test("Report should include volunteers without profiles", async () => {
    await UserCredentials.create({
      email: "noprofile@test.com",
      password: "password123",
      name: "No Profile User",
      role: "user"
    });

    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('noprofile@test.com');
    expect(res.text).toContain('N/A'); // Skills should be N/A
  });

  // TEST: Hours calculation
  test("Report should calculate total hours correctly", async () => {
    const testData = await createTestData();

    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    
    // volunteer1 should have 7 total hours (4 + 3)
    const lines = res.text.split('\n');
    const volunteer1Lines = lines.filter(line => line.includes('volunteer1@test.com'));
    
    // Check that total hours column shows 7 for volunteer1
    expect(volunteer1Lines.some(line => line.includes('7'))).toBe(true);
  });

  // TEST: Event count calculation
  test("Report should calculate total events correctly", async () => {
    const testData = await createTestData();

    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    
    // volunteer1 participated in 2 events
    const lines = res.text.split('\n');
    const volunteer1Lines = lines.filter(line => line.includes('volunteer1@test.com'));
    
    // Total Events should be 2
    expect(volunteer1Lines.some(line => line.includes('2'))).toBe(true);
  });

  // TEST: Skills formatting
  test("Report should format skills correctly", async () => {
    await UserCredentials.create({
      email: "multiskill@test.com",
      password: "password123",
      name: "Multi Skill User",
      role: "user"
    });

    await UserProfile.create({
      userEmail: "multiskill@test.com",
      fullName: "Multi Skill User",
      skills: ["skill1", "skill2", "skill3"],
      state: "TX",
      zipcode: "77005"
    });

    const res = await request(app).get("/api/reports/volunteer-history?format=csv");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('skill1, skill2, skill3');
  });
});