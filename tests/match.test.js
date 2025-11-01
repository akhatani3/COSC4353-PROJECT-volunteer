// tests/match.test.js
const request = require('supertest');
const express = require('express');
const matchRouter = require('../routes/match');

const app = express();
app.use(express.json());
app.use('/api/match', matchRouter);

describe('Match API', () => {
  test('GET /api/match should return matches', async () => {
    const res = await request(app).get('/api/match');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('event');
    expect(res.body[0]).toHaveProperty('matchedVolunteers');
    expect(Array.isArray(res.body[0].matchedVolunteers)).toBe(true);
  });
});
