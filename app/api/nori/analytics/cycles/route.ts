import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/current-user';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Category from '@/models/Category';
import { annualWindow } from '@/lib/annual-spending';
import { loadCycleConfig } from '@/lib/cycle-server';
import { cycleState } from '@/lib/cycle-config';
import type { CycleCategoryTotal } from '@/lib/cycle-spending';

export async function GET(request?: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    await dbConnect();
    const now = new Date();
    const { start, end } = annualWindow(now);
    const [config, categories] = await Promise.all([
      loadCycleConfig(owner.id), Category.find(owner.scope).sort({ order: 1 }).lean(),
    ]);
    const timeline = cycleState(config, now);
    const cycles = timeline.cycles.filter(cycle => new Date(cycle.endDate) >= start && new Date(cycle.startDate) < end)
      .map(cycle => ({ ...cycle, isCurrent: cycle.cycleId === timeline.cycles[timeline.currentIndex]?.cycleId }));
    const requestedCycle = request ? new URL(request.url).searchParams.get('cycleId') : null;
    if (requestedCycle !== null && !cycles.some(cycle => cycle.cycleId === requestedCycle)) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }
    const names = new Map(categories.map(category => [category.name, String(category._id)]));
    const match = { ...owner.scope, date: { $gte: new Date(cycles[0]?.startDate ?? start), $lt: end }, amount: { $lt: 0 } };
    const cycleExpression = { $switch: {
      branches: cycles.map(cycle => ({ case: { $and: [
        { $gte: ['$date', new Date(cycle.startDate)] }, { $lte: ['$date', new Date(cycle.endDate)] },
      ] }, then: cycle.cycleId })), default: null,
    } };
    if (requestedCycle !== null) {
      const cycle = cycles.find(cycle => cycle.cycleId === requestedCycle)!;
      const records = await Transaction.aggregate([
        { $match: { ...match, date: { $gte: new Date(cycle.startDate), $lte: new Date(Math.min(Date.parse(cycle.endDate), end.getTime() - 1)) } } },
        { $set: { cycleId: cycleExpression } },
        { $match: { cycleId: requestedCycle } },
        { $sort: { date: -1, _id: -1 } },
        { $project: { name: 1, category: 1, date: 1, amountCents: { $round: [{ $multiply: ['$amount', -100] }, 0] } } },
      ]);
      return NextResponse.json({ records: records.map(record => ({ ...record, category: names.get(record.category) ?? record.category })) }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const totals: CycleCategoryTotal[] = cycles.length ? await Transaction.aggregate([
      { $match: match },
      { $group: {
        _id: { category: '$category', cycleId: cycleExpression },
        amountCents: { $sum: { $round: [{ $multiply: ['$amount', -100] }, 0] } },
      } },
      { $match: { '_id.cycleId': { $ne: null } } },
      { $project: { _id: 0, category: '$_id.category', cycleId: '$_id.cycleId', amountCents: 1 } },
    ]) : [];
    // Historical records may store category names instead of IDs.
    const options = new Map(categories.filter(category => category.type !== 'income').map(category => [String(category._id), category.name]));
    for (const row of totals) {
      row.category = names.get(row.category) ?? row.category;
      if (!options.has(row.category)) options.set(row.category, row.category);
    }
    return NextResponse.json({ asOf: now.toISOString(), cycles, totals, categories: Array.from(options, ([id, name]) => ({ id, name })) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Failed to load cycle spending' }, { status: 500 });
  }
}
