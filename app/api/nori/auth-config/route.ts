import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), email: false, ready: !!(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32 && process.env.BETTER_AUTH_URL) });
}
