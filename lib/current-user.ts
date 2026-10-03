import 'server-only';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getAuth } from './account-auth';
import { isWatchRoute, validWatchToken } from './auth';
import { LEGACY_OWNER_EMAIL, normalizeEmail, dataScope } from './user-scope.mjs';

const collections = ['transactions', 'categories', 'paymentmethods', 'budgets', 'fixedcosts', 'dailyaverageconfigs'];
let legacyClaim: Promise<void> | undefined;
async function claimLegacy(user: { id: string; email: string; emailVerified: boolean }) {
  if (normalizeEmail(user.email) !== LEGACY_OWNER_EMAIL || !user.emailVerified) return;
  legacyClaim ??= (async () => {
    const db = mongoose.connection.db!;
    const marker = await db.collection('nori_migrations').findOne({ key: 'legacy-owner' });
    if (marker) {
      if (marker.userId !== user.id) throw new Error('Legacy owner identity mismatch');
      return;
    }
    for (const collection of collections) {
      await db.collection(collection).updateMany({ userId: null }, { $set: { userId: user.id } });
    }
    await db.collection('nori_migrations').updateOne({ key: 'legacy-owner' }, { $set: { userId: user.id, completedAt: new Date() } }, { upsert: true });
  })().catch(error => { legacyClaim = undefined; throw error; });
  await legacyClaim;
}

export async function requireUser() {
  const incoming = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: incoming });
  let user = session?.user;
  if (!user) {
    const method = incoming.get('x-nori-watch-method');
    const path = incoming.get('x-nori-watch-path');
    if (method && path && isWatchRoute(method, path) && validWatchToken(incoming.get('authorization'), process.env.WATCH_TOKEN_SHA256)) {
      const email = normalizeEmail(process.env.WATCH_USER_EMAIL || LEGACY_OWNER_EMAIL);
      const owner = await mongoose.connection.db!.collection('user').findOne({ email, emailVerified: true });
      if (owner) user = { id: String(owner._id), email: owner.email, emailVerified: true, name: owner.name, createdAt: owner.createdAt, updatedAt: owner.updatedAt, image: owner.image };
    }
  }
  if (!user?.emailVerified) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await claimLegacy(user);
  return { ...user, scope: dataScope(user) };
}
