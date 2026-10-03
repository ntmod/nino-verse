import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Use Google to sign in' }, { status: 403 });
}
