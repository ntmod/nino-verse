import mongoose, { Schema } from 'mongoose';

const WalletSchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  budgetCents: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  archived: { type: Boolean, default: false },
  revision: { type: Number, default: 0 },
}, { timestamps: true });

if (mongoose.models.Wallet && !mongoose.models.Wallet.schema.path('archived')) mongoose.models.Wallet.schema.add({ archived: { type: Boolean, default: false } });

export default mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
