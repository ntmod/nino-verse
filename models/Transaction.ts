import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId?: string;
  name: string;
  category: string;
  subCategory?: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  walletId?: string;
  refunds?: { requestId: string; amountCents: number; createdAt: Date; kind: 'refund' | 'cancel' }[];
  createdAt: Date;
}

const refundFields = [{ requestId: { type: String, required: true }, amountCents: { type: Number, required: true, min: 1, validate: Number.isSafeInteger }, kind: { type: String, enum: ['refund', 'cancel'], required: true }, createdAt: { type: Date, required: true } }];

const TransactionSchema: Schema = new Schema({
  userId: { type: String, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: false },
  amount: { type: Number, required: true }, // Negative for expenses, positive for income
  date: { type: Date, required: true },
  paymentMethod: { type: String, required: true },
  walletId: { type: String, default: '' },
  refunds: { type: refundFields, default: undefined },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Transaction && !mongoose.models.Transaction.schema.path("userId")) {
  mongoose.models.Transaction.schema.add({ userId: { type: String, index: true } });
}

if (mongoose.models.Transaction && !mongoose.models.Transaction.schema.path('walletId')) {
  mongoose.models.Transaction.schema.add({ walletId: { type: String, default: '' } });
}
if (mongoose.models.Transaction && !mongoose.models.Transaction.schema.path('refunds')) mongoose.models.Transaction.schema.add({ refunds: { type: refundFields, default: undefined } });
TransactionSchema.index({ userId: 1, walletId: 1, date: 1 });

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
