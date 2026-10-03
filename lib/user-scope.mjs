export const LEGACY_OWNER_EMAIL = 'ntmod001@gmail.com';

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/** Only the verified legacy owner can see records that predate user accounts. */
export function dataScope(user) {
  if (!user?.id || !user.emailVerified) throw new Error('Verified user required');
  return normalizeEmail(user.email) === LEGACY_OWNER_EMAIL
    ? { $or: [{ userId: user.id }, { userId: { $exists: false } }, { userId: null }] }
    : { userId: user.id };
}
