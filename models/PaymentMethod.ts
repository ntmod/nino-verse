import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentMethod extends Document {
  name: string;
  icon: string;
  color: string;
  order: number;
  desc?: string;
  createdAt: Date;
}

const PaymentMethodSchema: Schema = new Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  order: { type: Number, default: 0 },
  desc: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);
