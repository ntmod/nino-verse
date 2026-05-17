import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  name: string;
  category: string;
  subCategory?: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: false },
  amount: { type: Number, required: true }, // Negative for expenses, positive for income
  date: { type: Date, required: true },
  paymentMethod: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
