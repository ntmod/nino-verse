import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/current-user';
import dbConnect from '@/lib/db';
import Wallet from '@/models/Wallet';
import WalletTransfer from '@/models/WalletTransfer';
import { moneyCents } from '@/lib/wallet-budget';
import { walletSnapshot } from '@/lib/wallet-server';

export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { fromWalletId, toWalletId, amount, requestId } = await request.json();
    if (typeof fromWalletId !== 'string' || typeof toWalletId !== 'string' || !mongoose.isValidObjectId(fromWalletId) || !mongoose.isValidObjectId(toWalletId) || fromWalletId === toWalletId || typeof requestId !== 'string' || !/^[\w-]{8,80}$/.test(requestId)) return NextResponse.json({ error: 'Invalid transfer' }, { status: 400 });
    let amountCents;
    try { amountCents = moneyCents(amount); }
    catch { return NextResponse.json({ error: 'Invalid amount' }, { status: 400 }); }
    await dbConnect();
    const result = await mongoose.connection.transaction(async session => {
      const previous = await WalletTransfer.findOne({ userId: owner.id, requestId }).session(session);
      if (previous) {
        if (previous.fromWalletId !== fromWalletId || previous.toWalletId !== toWalletId || previous.amountCents !== amountCents) return { error: 'Request ID already used', status: 409 };
        return { transfer: previous, status: 200 };
      }
      // Serialize competing transfers from a wallet; retries re-read available budget.
      const source = await Wallet.findOneAndUpdate({ _id: fromWalletId, userId: owner.id }, { $inc: { revision: 1 } }, { session, new: true });
      const destination = await Wallet.findOneAndUpdate({ _id: toWalletId, userId: owner.id }, { $inc: { revision: 1 } }, { session, new: true });
      if (!source || !destination) return { error: 'Wallet not found', status: 404 };
      const snapshot = await walletSnapshot(owner, session);
      const from = snapshot.wallets.find(wallet => wallet._id === fromWalletId)!;
      const to = snapshot.wallets.find(wallet => wallet._id === toWalletId)!;
      if (from.archived || to.archived) return { error: 'Wallet archived', status: 409 };
      if (from.remainingCents < amountCents) return { error: 'Insufficient budget', status: 409 };
      if (!Number.isSafeInteger(to.allocatedCents + amountCents)) return { error: 'Budget exceeds supported range', status: 400 };
      const [transfer] = await WalletTransfer.create([{ userId: owner.id, fromWalletId, toWalletId, amountCents, cycleKey: snapshot.cycleKey, requestId }], { session });
      return { transfer, status: 201 };
    });
    return NextResponse.json('error' in result ? { error: result.error } : result.transfer, { status: result.status });
  } catch { return NextResponse.json({ error: 'Could not transfer budget. Please retry.' }, { status: 503 }); }
}
