// tests/events.test.js
const request = require('supertest');
const express = require('express');
const eventsRouter = require('../routes/events');

const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

describe('Events API', () => {
  test('GET /api/events should return hard-coded events', async () => {
    const res = await request(app).get('/api/events');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0); // at least 2 hard-coded events
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('location');
  });

  test('POST /api/events/add should add a new event', async () => {
    const newEvent = {
      name: "Test Event",
      details: "Testing",
      location: "Test Location",
      skillsRequired: ["organization"],
      urgency: "medium",
      date: "2025-10-30"
    };

    const res = await request(app).post('/api/events/add').send(newEvent);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Test Event");
    expect(res.body).toHaveProperty('id');
  });

  test('POST /api/events/add missing required fields should return 400', async () => {
    const res = await request(app).post('/api/events/add').send({ name: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});
