import 'server-only';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import mongoose from 'mongoose';
import dbConnect from './db';

function configureAuth() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || !process.env.BETTER_AUTH_URL) throw new Error('Account authentication is not configured');
  return betterAuth({
    appName: 'NoriNote',
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.SESSION_SECRET,
    database: mongodbAdapter(mongoose.connection.db!),
    emailAndPassword: { enabled: false },
    socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET },
    } : {},
    // Require verification on both sides before implicitly linking the same email.
    account: { accountLinking: { enabled: true, trustedProviders: [] } },
    rateLimit: { enabled: true, storage: 'database' },
    session: { expiresIn: 60 * 60 * 24 * 7 },
  });
}
let instance: ReturnType<typeof configureAuth> | undefined;
export async function getAuth() {
  await dbConnect();
  return instance ??= configureAuth();
}
