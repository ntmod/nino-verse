import mongoose, { Schema, Document } from "mongoose";

export interface IFixedCost extends Document {
  userId?: string;
  name: string;
  amount: number;
  category: string;
  paymentMethod: string;
  walletId?: string;
  order: number;
  createdAt: Date;
}

const FixedCostSchema: Schema = new Schema({
  userId: { type: String, index: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  walletId: { type: String, default: '' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.FixedCost && !mongoose.models.FixedCost.schema.path("userId")) {
  mongoose.models.FixedCost.schema.add({ userId: { type: String, index: true } });
}

if (mongoose.models.FixedCost && !mongoose.models.FixedCost.schema.path('walletId')) mongoose.models.FixedCost.schema.add({ walletId: { type: String, default: '' } });

export default mongoose.models.FixedCost || mongoose.model<IFixedCost>("FixedCost", FixedCostSchema);
