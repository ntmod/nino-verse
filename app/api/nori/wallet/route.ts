import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/current-user';
import dbConnect from '@/lib/db';
import Wallet from '@/models/Wallet';
import { moneyCents } from '@/lib/wallet-budget';
import { walletSnapshot } from '@/lib/wallet-server';

export async function GET(request?: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const params = request ? new URL(request.url).searchParams : null;
    if (params?.get('choices') === '1') {
      await dbConnect();
      const wallets = await Wallet.find({ userId: owner.id }).sort({ createdAt: 1 }).select('name budgetCents archived').lean();
      return NextResponse.json(wallets);
    }
    const start = params?.get('startDate'), end = params?.get('endDate');
    const range = start && end ? { startDate: new Date(start), endDate: new Date(end) } : undefined;
    if ((Boolean(start) !== Boolean(end)) || (range && (!Number.isFinite(+range.startDate) || !Number.isFinite(+range.endDate) || +range.startDate > +range.endDate))) return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    await dbConnect();
    return NextResponse.json(await walletSnapshot(owner, null, range));
  } catch { return NextResponse.json({ error: 'Could not load wallets' }, { status: 500 }); }
}
export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const body = await request.json();
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80) return NextResponse.json({ error: 'Invalid wallet name' }, { status: 400 });
    let budgetCents;
    try { budgetCents = moneyCents(body.budget, true); }
    catch { return NextResponse.json({ error: 'Invalid budget' }, { status: 400 }); }
    await dbConnect();
    const wallet = await Wallet.create({ userId: owner.id, name: body.name.trim(), budgetCents });
    return NextResponse.json(wallet, { status: 201 });
  } catch { return NextResponse.json({ error: 'Could not create wallet' }, { status: 500 }); }
}
