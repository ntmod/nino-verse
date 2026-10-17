import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/current-user';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { refundPlan } from '@/lib/refund';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    const input = await request.json();
    await dbConnect();
    const record = await Transaction.findOne({ $and: [owner.scope, { _id: id }] });
    if (!record) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    let plan;
    try { plan = refundPlan(record, input); }
    catch { return NextResponse.json({ error: 'Invalid refund or amount exceeds remaining expense' }, { status: 400 }); }
    if (plan.duplicate) return NextResponse.json(record);
    // Compare-and-swap prevents concurrent refunds from consuming the same remaining expense.
    const updated = await Transaction.findOneAndUpdate({ $and: [owner.scope, { _id: id, amount: record.amount, 'refunds.requestId': { $ne: input.requestId } }] }, {
      $set: { amount: plan.nextAmount },
      $push: { refunds: { requestId: input.requestId, amountCents: plan.amountCents, kind: input.kind, createdAt: new Date() } },
    }, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: 'Expense changed. Refresh and retry.' }, { status: 409 });
    return NextResponse.json(updated);
  } catch { return NextResponse.json({ error: 'Could not refund expense' }, { status: 500 }); }
}
