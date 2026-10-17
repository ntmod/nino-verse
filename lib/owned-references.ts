import 'server-only';
import mongoose from 'mongoose';
import Category from '@/models/Category';
import Wallet from '@/models/Wallet';
import PaymentMethod from '@/models/PaymentMethod';

export async function ownedReferences(body: { category?: unknown; paymentMethod?: unknown; walletId?: unknown }, scope: object) {
  for (const [key, model] of [['category', Category], ['paymentMethod', PaymentMethod]] as const) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') return false;
    const reference = mongoose.isValidObjectId(value) ? { $or: [{ _id: value }, { name: value }] } : { name: value };
    if (!await model.exists({ $and: [scope, reference] })) return false;
  }
  if (body.walletId !== undefined && body.walletId !== '') {
    if (typeof body.walletId !== 'string' || !mongoose.isValidObjectId(body.walletId) || !await Wallet.exists({ $and: [scope, { _id: body.walletId, archived: { $ne: true } }] })) return false;
  }
  return true;
}
