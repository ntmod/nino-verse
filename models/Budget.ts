import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  category: string;
  limit: number;
  icon: string;
  color: string;
  createdAt: Date;
}

const BudgetSchema: Schema = new Schema({
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
