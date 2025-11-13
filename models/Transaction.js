import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    userEmail: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", schema);
