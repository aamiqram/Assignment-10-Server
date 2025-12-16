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

// TRANSACTION ROUTES
// Get all transactions for a user
// URL: GET /api/transactions/:email?sort=date-desc
app.get("/api/transactions/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { sort } = req.query;

    // Determine sort option
    let sortOption = { date: -1 }; // Default: newest first

    if (sort === "date-asc") sortOption = { date: 1 };
    else if (sort === "amount-desc") sortOption = { amount: -1 };
    else if (sort === "amount-asc") sortOption = { amount: 1 };

    const transactions = await db
      .collection("transactions")
      .find({ email })
      .sort(sortOption)
      .toArray();

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Get single transaction by ID
// URL: GET /api/transaction/:id
app.get("/api/transaction/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await db
      .collection("transactions")
      .findOne({ _id: new ObjectId(id) });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});



// ERROR HANDLING MIDDLEWARE
// 404 handler - catches all undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    requestedUrl: req.originalUrl,
    method: req.method,
    availableRoutes: {
      root: "GET /",
      health: "GET /api/health",
      transactions: "GET /api/transactions/:email",
      transaction: "GET /api/transaction/:id",
    },
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
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
