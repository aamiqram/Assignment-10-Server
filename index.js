import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Transaction from "./models/Transaction.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" })); // Quick MVP
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Mongo OK"))
  .catch((err) => console.error("Mongo error:", err));

app.get("/api/transactions/my-transactions", async (req, res) => {
  const { userEmail } = req.query;
  const transactions = await Transaction.find({ userEmail }).sort({
    createdAt: -1,
  });
  res.json(transactions);
});

app.post("/api/transactions/add-transaction", async (req, res) => {
  const transaction = new Transaction(req.body);
  await transaction.save();
  res.status(201).json(transaction);
});

app.get("/api/transactions/:id", async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  res.json(transaction);
});

app.put("/api/transactions/update/:id", async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(transaction);
});

app.delete("/api/transactions/delete/:id", async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.get("/api/transactions/summary", async (req, res) => {
  const { userEmail } = req.query;
  const aggregates = await Transaction.aggregate([
    { $match: { userEmail } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const income = aggregates.find((a) => a._id === "income")?.total || 0;
  const expense = aggregates.find((a) => a._id === "expense")?.total || 0;
  res.json({ balance: income - expense, income, expenses: expense });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
