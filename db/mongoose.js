// db/mongoose.js
const mongoose = require("mongoose");

async function connect(uri) {
  const mongoUri = uri || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/volunteer_db";
  await mongoose.connect(mongoUri, { dbName: "volunteer_db" });
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { mongoose, connect, disconnect };
