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

// ROOT & TEST ROUTES
// Root route
app.get("/", (req, res) => {
  res.json({
    message: "🎉 Welcome to FinEase API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      transactions: {
        getAll: "GET /api/transactions/:email",
        getOne: "GET /api/transaction/:id",
        create: "POST /api/transactions",
        update: "PUT /api/transactions/:id",
        delete: "DELETE /api/transactions/:id",
      },
      test: {
        health: "GET /api/health",
        database: "GET /api/test-db",
      },
    },
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db ? "connected" : "disconnected",
  });
});

// Database test route
app.get("/api/test-db", async (req, res) => {
  try {
    const transactions = await db
      .collection("transactions")
      .find({})
      .limit(10)
      .toArray();

    res.json({
      message: "Database connection successful",
      totalTransactions: await db.collection("transactions").countDocuments(),
      sampleTransactions: transactions,
      collections: await db.listCollections().toArray(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Database test failed",
      error: error.message,
    });
  }
});



// SERVER STARTUP
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FinEase API Server Running Port: ${PORT}Environment: ${
      process.env.NODE_ENV || "development"
    }Database: Connected ✅ View API: http://localhost:${PORT}
    `);
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await client.close();
  console.log("✅ Database connection closed");
  process.exit(0);
});
