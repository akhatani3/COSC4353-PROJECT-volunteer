// test/notifications.test.js
const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");
const notificationsRouter = require("../routes/notifications");

const dataDir = path.join(__dirname, "..", "data");
const notificationsFile = path.join(dataDir, "notifications.json");

function resetStore() {
  try {
    if (fs.existsSync(notificationsFile)) fs.unlinkSync(notificationsFile);
    if (fs.existsSync(dataDir)) {
      const entries = fs.readdirSync(dataDir);
      if (entries.length === 0) fs.rmdirSync(dataDir);
    }
  } catch (_) {}
}

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/notifications", notificationsRouter);
  return app;
}

describe("Notifications API", () => {
  let app;

  beforeEach(() => {
    resetStore();
    app = makeApp();
  });

  afterAll(() => {
    resetStore();
  });

  test("POST /api/notifications creates a notification", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .send({
        userId: "u1",
        type: "assignment",
        message: "You were assigned to E1",
        relatedEventId: "E1",
      })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toMatchObject({
      userId: "u1",
      type: "assignment",
      message: "You were assigned to E1",
      relatedEventId: "E1",
      read: false,
    });
    expect(typeof res.body.createdAt).toBe("string");
  });

  test("GET requires userId", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "userId is required" });
  });

  test("GET returns notifications for a user sorted by createdAt desc", async () => {
    await request(app).post("/api/notifications").send({
      userId: "u1",
      type: "assignment",
      message: "First",
    });
    await request(app).post("/api/notifications").send({
      userId: "u1",
      type: "reminder",
      message: "Second",
    });
    await request(app).post("/api/notifications").send({
      userId: "u2",
      type: "info",
      message: "Other user",
    });

    const res = await request(app).get("/api/notifications").query({ userId: "u1" });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    const messages = res.body.map((n) => n.message);
    expect(messages).toEqual(["Second", "First"]);
  });

  test("GET with unreadOnly=true filters unread", async () => {
    const created1 = await request(app).post("/api/notifications").send({
      userId: "u1",
      type: "assignment",
      message: "Unread one",
    });
    const created2 = await request(app).post("/api/notifications").send({
      userId: "u1",
      type: "assignment",
      message: "Will be read",
    });

    const idToRead = created2.body.id;
    const patchRes = await request(app).patch(`/api/notifications/${idToRead}/read`);
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.read).toBe(true);

    const res = await request(app)
      .get("/api/notifications")
      .query({ userId: "u1", unreadOnly: "true" });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].message).toBe("Unread one");
    expect(res.body[0].read).toBe(false);
  });

  test("PATCH /:id/read marks as read and 404s for unknown id", async () => {
    const created = await request(app).post("/api/notifications").send({
      userId: "u1",
      type: "assignment",
      message: "Mark me",
    });
    const id = created.body.id;

    const res = await request(app).patch(`/api/notifications/${id}/read`);
    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);

    const res404 = await request(app).patch(`/api/notifications/does_not_exist/read`);
    expect(res404.status).toBe(404);
    expect(res404.body).toEqual({ error: "Not found" });
  });

  test("DELETE /:id removes the notification", async () => {
    const created = await request(app).post("/api/notifications").send({
      userId: "u1",
      type: "assignment",
      message: "Delete me",
    });
    const id = created.body.id;

    const del = await request(app).delete(`/api/notifications/${id}`);
    expect(del.status).toBe(200);
    expect(del.body.id).toBe(id);

    const list = await request(app).get("/api/notifications").query({ userId: "u1" });
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(0);
  });

  test("POST validates required fields", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .send({ userId: "", type: "x", message: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(String(res.body.error)).toMatch(/Missing required field:/);
  });
});
