import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/current-user';
import dbConnect from '@/lib/db';
import Wallet from '@/models/Wallet';
import { moneyCents } from '@/lib/wallet-budget';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    const body = await request.json();
    if (typeof body.archived === 'boolean') {
      await dbConnect();
      const wallet = await Wallet.findOneAndUpdate({ _id: id, userId: owner.id }, { $set: { archived: body.archived }, $inc: { revision: 1 } }, { new: true, runValidators: true });
      return wallet ? NextResponse.json(wallet) : NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80) return NextResponse.json({ error: 'Invalid wallet name' }, { status: 400 });
    let budgetCents;
    try { budgetCents = moneyCents(body.budget, true); }
    catch { return NextResponse.json({ error: 'Invalid budget' }, { status: 400 }); }
    await dbConnect();
    const wallet = await Wallet.findOneAndUpdate({ _id: id, userId: owner.id }, { $set: { name: body.name.trim(), budgetCents }, $inc: { revision: 1 } }, { new: true, runValidators: true });
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    return NextResponse.json(wallet);
  } catch { return NextResponse.json({ error: 'Could not update wallet' }, { status: 500 }); }
}
