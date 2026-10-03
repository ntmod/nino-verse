import 'server-only';
import mongoose from 'mongoose';
import Category from '@/models/Category';
import PaymentMethod from '@/models/PaymentMethod';
import Transaction from '@/models/Transaction';
import { dataScope } from './user-scope.mjs';

export async function needsOnboarding(user: { id: string; email: string; emailVerified: boolean }) {
  const profile = await mongoose.connection.db!.collection('user').findOne({ _id: new mongoose.Types.ObjectId(user.id) });
  if (profile?.onboardingCompletedAt) return false;
  if (profile?.onboardingStartedAt) return true;
  const scope = dataScope(user);
  const existing = await Promise.all([Category.exists(scope), PaymentMethod.exists(scope), Transaction.exists(scope)]);
  return !existing.some(Boolean);
}
