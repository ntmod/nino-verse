import mongoose, { Schema } from 'mongoose';

const WalletTransferSchema = new Schema({
  userId: { type: String, required: true },
  fromWalletId: { type: String, required: true },
  toWalletId: { type: String, required: true },
  amountCents: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  cycleKey: { type: String, required: true },
  requestId: { type: String, required: true },
}, { timestamps: true });
WalletTransferSchema.index({ userId: 1, requestId: 1 }, { unique: true });
WalletTransferSchema.index({ userId: 1, cycleKey: 1 });
export default mongoose.models.WalletTransfer || mongoose.model('WalletTransfer', WalletTransferSchema);
