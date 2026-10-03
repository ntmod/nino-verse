import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { requireUser } from '@/lib/current-user';
import { onboardingPlan } from '@/lib/onboarding-presets.mjs';

export async function POST(request: Request) {
  try {
    const owner = await requireUser();
    if (owner instanceof Response) return owner;
    const db = mongoose.connection.db!;
    const profileId = new mongoose.Types.ObjectId(owner.id);
    const profile = await db.collection('user').findOne({ _id: profileId });
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    if (profile.onboardingCompletedAt) return NextResponse.json({ success: true });
    const body = await request.json();
    if (body.skip !== true) {
      let plan;
      try { plan = onboardingPlan(body); }
      catch { return NextResponse.json({ error: 'Invalid setup details' }, { status: 400 }); }
      await db.collection('user').updateOne({ _id: profileId }, { $set: { onboardingStartedAt: new Date() } });
      // Stable IDs make retries safe even when a request fails partway through setup.
      const id = (key: string) => new mongoose.Types.ObjectId(createHash('sha256').update(`${owner.id}:onboarding:${key}`).digest('hex').slice(0, 24));
      for (const [index, category] of plan.categories.entries()) {
        const _id = id(`category:${category.name}`);
        await db.collection('categories').updateOne({ _id, userId: owner.id }, { $setOnInsert: { ...category, userId: owner.id, order: index, subcategories: [], createdAt: new Date() } }, { upsert: true });
      }
      const _id = id('wallet');
      await db.collection('paymentmethods').updateOne({ _id, userId: owner.id }, { $set: plan.wallet, $setOnInsert: { userId: owner.id, order: 0, createdAt: new Date() } }, { upsert: true });
    }
    await db.collection('user').updateOne({ _id: profileId }, { $set: { onboardingCompletedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Could not set up your notebook' }, { status: 500 }); }
}
