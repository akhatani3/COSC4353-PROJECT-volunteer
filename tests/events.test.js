// tests/events.test.js
const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const eventsRouter = require('../routes/eventsMongo'); // use your new MongoDB router

let mongoServer;
const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('Events API with MongoDB', () => {
  test('GET /api/events should return empty array initially', async () => {
    const res = await request(app).get('/api/events');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
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

    // Verify it exists in DB
    const getRes = await request(app).get('/api/events');
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].name).toBe("Test Event");
  });

  test('POST /api/events/add missing required fields should return 400', async () => {
    const res = await request(app).post('/api/events/add').send({ name: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});
