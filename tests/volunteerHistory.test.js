// tests/volunteerHistory.test.js
const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = require("../routes/volunteerHistory");

const dataDir = path.join(__dirname, "..", "data");
const storeFile = path.join(dataDir, "volunteerHistory.json");

function resetStore() {
  try {
    if (fs.existsSync(storeFile)) fs.unlinkSync(storeFile);
    if (fs.existsSync(dataDir)) {
      const entries = fs.readdirSync(dataDir);
      if (entries.length === 0) fs.rmdirSync(dataDir);
    }
  } catch (_) {}
}
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/volunteer-history", router);
  return app;
}

describe("Volunteer History API", () => {
  let app;
  beforeEach(() => {
    resetStore();
    app = makeApp();
  });
  afterAll(() => resetStore());

  test("POST creates a record", async () => {
    const res = await request(app)
      .post("/api/volunteer-history")
      .send({ userId: "u1", eventId: "e1", role: "Greeter", hours: 2, status: "completed" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toMatchObject({
      userId: "u1",
      eventId: "e1",
      role: "Greeter",
      hours: 2,
      status: "completed",
    });
  });

  test("POST validates required fields and hours", async () => {
    const missing = await request(app).post("/api/volunteer-history").send({ userId: "u1" });
    expect(missing.status).toBe(400);
    const badHours = await request(app)
      .post("/api/volunteer-history")
      .send({ userId: "u1", eventId: "e1", hours: -1 });
    expect(badHours.status).toBe(400);
    expect(String(badHours.body.error)).toMatch(/hours/);
  });

  test("GET filters by user and sorts desc by participationDate", async () => {
    await request(app).post("/api/volunteer-history").send({
      userId: "u1", eventId: "e1", role: "A", hours: 1, participationDate: "2024-01-01T00:00:00.000Z",
    });
    await request(app).post("/api/volunteer-history").send({
      userId: "u1", eventId: "e2", role: "B", hours: 2, participationDate: "2025-01-01T00:00:00.000Z",
    });
    await request(app).post("/api/volunteer-history").send({
      userId: "u2", eventId: "e9", role: "C", hours: 3,
    });

    const res = await request(app).get("/api/volunteer-history").query({ userId: "u1" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map(r => r.eventId)).toEqual(["e2", "e1"]);
  });

  test("GET can filter by userId and eventId together", async () => {
    await request(app).post("/api/volunteer-history").send({ userId: "u1", eventId: "e1" });
    await request(app).post("/api/volunteer-history").send({ userId: "u1", eventId: "e2" });
    const res = await request(app).get("/api/volunteer-history").query({ userId: "u1", eventId: "e2" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].eventId).toBe("e2");
  });

  test("PATCH updates allowed fields", async () => {
    const created = await request(app).post("/api/volunteer-history").send({
      userId: "u1", eventId: "e1", role: "Runner", hours: 1, status: "completed",
    });
    const id = created.body.id;
    const upd = await request(app).patch(`/api/volunteer-history/${id}`).send({ hours: 4, role: "Lead" });
    expect(upd.status).toBe(200);
    expect(upd.body.hours).toBe(4);
    expect(upd.body.role).toBe("Lead");
  });

  test("PATCH validates hours and 404 on unknown id", async () => {
    const bad = await request(app).patch("/api/volunteer-history/nope").send({ hours: 1 });
    expect(bad.status).toBe(404);
    const created = await request(app).post("/api/volunteer-history").send({ userId: "u1", eventId: "e1" });
    const badHours = await request(app).patch(`/api/volunteer-history/${created.body.id}`).send({ hours: -2 });
    expect(badHours.status).toBe(400);
  });

  test("DELETE removes a record", async () => {
    const created = await request(app).post("/api/volunteer-history").send({ userId: "u1", eventId: "e1" });
    const id = created.body.id;
    const del = await request(app).delete(`/api/volunteer-history/${id}`);
    expect(del.status).toBe(200);
    const list = await request(app).get("/api/volunteer-history").query({ userId: "u1" });
    expect(list.body).toHaveLength(0);
  });
});
