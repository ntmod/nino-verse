import { getAuth } from '@/lib/account-auth';
import { NextResponse } from 'next/server';

async function handle(request: Request) {
  const path = new URL(request.url).pathname;
  if (['/sign-in/email', '/sign-up/email', '/request-password-reset', '/reset-password', '/send-verification-email', '/verify-email', '/set-password', '/change-password'].some(endpoint => path.endsWith(endpoint))) {
    return NextResponse.json({ message: 'Use Google to sign in' }, { status: 403 });
  }
  try { return await (await getAuth()).handler(request); }
  catch { return NextResponse.json({ message: 'Authentication is temporarily unavailable' }, { status: 503 }); }
}
export const GET = handle;
export const POST = handle;
