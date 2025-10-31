
// tests/auth.test.js
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const authRoutes = require("../routes/auth");
const User = require("../models/UserCredentials");

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
  app.use("/api/auth", authRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear database after each test
  await User.deleteMany({});
});

describe("Auth Routes", () => {
  test("GET /api/auth should return success", async () => {
    const res = await request(app).get("/api/auth");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // LOGIN TESTS
  test("POST /api/auth/login with valid credentials should succeed", async () => {
    // First create user
    const user = new User({ email: "john@example.com", password: "password123", name: "John" });
    await user.save();

    const res = await request(app).post("/api/auth/login").send({
      email: "john@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.email).toBe("john@example.com");
    expect(res.body.token).toBeDefined();
  });

  test("POST /api/auth/login with invalid credentials should fail", async () => {
    const user = new User({ email: "john@example.com", password: "password123", name: "John" });
    await user.save();

    const res = await request(app).post("/api/auth/login").send({
      email: "john@example.com",
      password: "wrongpass",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email or password");
  });

  test("POST /api/auth/login with missing fields should fail", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "",
      password: "",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email and password are required");
  });

  // REGISTRATION TESTS
  test("POST /api/auth/register with new valid user should succeed", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "newuser@example.com",
      password: "newpassword123",
      confirm: "newpassword123",
      role: "user",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.email).toBe("newuser@example.com");
    expect(res.body.profile.role).toBe("user");
  });

  test("POST /api/auth/register with password mismatch should fail", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "mismatch@example.com",
      password: "password123",
      confirm: "password456",
      role: "user",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Passwords do not match");
  });

  test("POST /api/auth/register with duplicate email should fail", async () => {
    // First create user
    const user = new User({ email: "duplicate@example.com", password: "password123", name: "Duplicate" });
    await user.save();

    const res = await request(app).post("/api/auth/register").send({
      email: "duplicate@example.com",
      password: "password123",
      confirm: "password123",
      role: "user",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email already registered");
  });
});
