import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  userId?: string;
  category: string;
  limit: number;
  icon: string;
  color: string;
  createdAt: Date;
}

const BudgetSchema: Schema = new Schema({
  userId: { type: String, index: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Budget && !mongoose.models.Budget.schema.path("userId")) {
  mongoose.models.Budget.schema.add({ userId: { type: String, index: true } });
}

export default mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
