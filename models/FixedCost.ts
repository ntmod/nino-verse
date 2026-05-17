import mongoose, { Schema, Document } from "mongoose";

export interface IFixedCost extends Document {
  name: string;
  amount: number;
  category: string;
  paymentMethod: string;
  order: number;
  createdAt: Date;
}

const FixedCostSchema: Schema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.FixedCost || mongoose.model<IFixedCost>("FixedCost", FixedCostSchema);
