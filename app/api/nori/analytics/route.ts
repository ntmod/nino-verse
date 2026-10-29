import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/current-user';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { annualWindow, fillSpendingDays } from '@/lib/annual-spending';

export async function GET() {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const now = new Date();
    const { start, end } = annualWindow(now);
    await dbConnect();
    const rows = await Transaction.aggregate([
      { $match: { ...owner.scope, date: { $gte: start, $lt: end }, amount: { $lt: 0 } } },
      { $group: {
        _id: { $dateToString: { date: '$date', format: '%Y-%m-%d', timezone: 'Asia/Bangkok' } },
        amountCents: { $sum: { $round: [{ $multiply: ['$amount', -100] }, 0] } },
      } },
      { $project: { _id: 0, date: '$_id', amountCents: 1 } },
    ]);
    return NextResponse.json(fillSpendingDays(rows, now), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
