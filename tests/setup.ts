import dotenv from "dotenv";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";

let mongoServer: MongoMemoryServer;

// Set the Node environment to test
process.env.NODE_ENV = "test";

// Connect to a new in-memory database before running any tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear all test data after every test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Remove and close the db and server
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Don't silently swallow errors during tests
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection during test:", err);
});

export { app };
