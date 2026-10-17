import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/current-user';
import dbConnect from '@/lib/db';
import CycleSettings from '@/models/CycleSettings';
import Transaction from '@/models/Transaction';
import WalletTransfer from '@/models/WalletTransfer';
import Wallet from '@/models/Wallet';
import { loadCycleConfig } from '@/lib/cycle-server';
import { cycleState, proposeCycleChange } from '@/lib/cycle-config';
import { cycleImpact, type CycleRecord, type CycleTransfer } from '@/lib/cycle-impact';

export async function GET() {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    await dbConnect();
    return NextResponse.json(cycleState(await loadCycleConfig(owner.id)));
  } catch { return NextResponse.json({ error: 'Could not load cycles' }, { status: 500 }); }
}
export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const body = await request.json();
    if (!['activate', 'start', 'edit', 'configure'].includes(body.action) || typeof body.date !== 'string') return NextResponse.json({ error: 'Invalid cycle change' }, { status: 400 });
    await dbConnect();
    const config = await loadCycleConfig(owner.id);
    if (body.revision !== config.revision) return NextResponse.json({ error: 'Cycles changed. Preview again.' }, { status: 409 });
    const [data, movements, wallets] = await Promise.all([
      Transaction.find(owner.scope).sort({ _id: 1 }).lean(),
      WalletTransfer.find({ userId: owner.id }).sort({ _id: 1 }).lean(),
      Wallet.find({ userId: owner.id }).sort({ _id: 1 }).lean(),
    ]);
    const records: CycleRecord[] = data.map(item => ({ _id: String(item._id), date: item.date.toISOString(), name: item.name, amount: item.amount, walletId: item.walletId }));
    const transfers: CycleTransfer[] = movements.map(item => ({ _id: String(item._id), createdAt: item.createdAt.toISOString(), fromWalletId: item.fromWalletId, toWalletId: item.toWalletId, amountCents: item.amountCents }));
    const budgetWallets = wallets.map(item => ({ _id: String(item._id), name: item.name, budgetCents: item.budgetCents }));
    const earliest = new Date([...records.map(item => item.date), ...transfers.map(item => item.createdAt)].reduce((time, date) => Math.min(time, Date.parse(date)), Date.now()));
    let proposed;
    try { proposed = proposeCycleChange(config, body, earliest); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid cycle dates' }, { status: 400 }); }
    const impact = cycleImpact(config, proposed, records, transfers, budgetWallets);
    const previewHash = createHash('sha256').update(JSON.stringify({ config, proposed, records, transfers, budgetWallets })).digest('hex');
    if (!body.confirm) return NextResponse.json({ impact, previewHash, state: cycleState(proposed) });
    if (body.previewHash !== previewHash) return NextResponse.json({ error: 'Data changed. Preview again.' }, { status: 409 });
    const saved = await CycleSettings.findOneAndUpdate({ userId: owner.id, revision: config.revision }, { $set: { mode: proposed.mode, starts: proposed.starts, ids: proposed.ids, fixedDay: proposed.fixedDay ?? config.fixedDay ?? 30, automaticFrom: proposed.automaticFrom ?? null, revision: proposed.revision } }, { new: true, upsert: true, runValidators: true });
    if (!saved) return NextResponse.json({ error: 'Cycles changed. Preview again.' }, { status: 409 });
    return NextResponse.json(cycleState(proposed));
  } catch (error) {
    const conflict = error && typeof error === 'object' && 'code' in error && error.code === 11000;
    return NextResponse.json({ error: conflict ? 'Cycles changed. Preview again.' : 'Could not save cycle' }, { status: conflict ? 409 : 500 });
  }
}
