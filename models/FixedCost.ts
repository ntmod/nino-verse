import mongoose, { Schema, Document } from "mongoose";

export interface IFixedCost extends Document {
  userId?: string;
  name: string;
  amount: number;
  category: string;
  paymentMethod: string;
  order: number;
  createdAt: Date;
}

const FixedCostSchema: Schema = new Schema({
  userId: { type: String, index: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.FixedCost && !mongoose.models.FixedCost.schema.path("userId")) {
  mongoose.models.FixedCost.schema.add({ userId: { type: String, index: true } });
}

export default mongoose.models.FixedCost || mongoose.model<IFixedCost>("FixedCost", FixedCostSchema);
