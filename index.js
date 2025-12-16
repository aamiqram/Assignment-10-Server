import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE SETUP

app.use(cors());
app.use(express.json());

// Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MONGODB CONNECTION

let db;
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  try {
    //await client.connect();
    db = client.db("finease");
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}


// SERVER STARTUP
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FinEase API Server Running Port: ${PORT}Environment: ${
      process.env.NODE_ENV || "development"
    }Database: Connected ✅ View API: http://localhost:${PORT}
    `);
  });
});

