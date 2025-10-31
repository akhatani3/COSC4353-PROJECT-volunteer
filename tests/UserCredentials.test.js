const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const UserCredentials = require("../models/UserCredentials");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: "test_db" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await UserCredentials.deleteMany({});
});

describe("UserCredentials model", () => {
  it("should hash password before saving", async () => {
    const user = new UserCredentials({
      email: "test@example.com",
      password: "mypassword",
      name: "Test User"
    });

    await user.save();

    expect(user.password).not.toBe("mypassword");
    expect(user.password.length).toBeGreaterThan(0);
  });

  it("comparePassword should return true for correct password", async () => {
    const user = new UserCredentials({
      email: "test2@example.com",
      password: "mypassword",
      name: "Test User"
    });
    await user.save();

    const isMatch = await user.comparePassword("mypassword");
    expect(isMatch).toBe(true);
  });

  it("comparePassword should return false for wrong password", async () => {
    const user = new UserCredentials({
      email: "test3@example.com",
      password: "mypassword",
      name: "Test User"
    });
    await user.save();

    const isMatch = await user.comparePassword("wrongpassword");
    expect(isMatch).toBe(false);
  });

  it("should require email, password, and name", async () => {
    const user = new UserCredentials({});
    let err;
    try {
      await user.save();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.name).toBeDefined();
  });

  it("should default role to 'user'", async () => {
    const user = new UserCredentials({
      email: "test4@example.com",
      password: "mypassword",
      name: "Test User"
    });
    await user.save();
    expect(user.role).toBe("user");
  });

  it("should allow setting role to 'admin'", async () => {
    const user = new UserCredentials({
      email: "admin@example.com",
      password: "mypassword",
      name: "Admin User",
      role: "admin"
    });
    await user.save();
    expect(user.role).toBe("admin");
  });
});
