import { NextResponse, type NextRequest } from 'next/server';
import { hasValidSession } from '@/lib/auth';

/** Returns a 401 JSON response if the request lacks a valid admin session; else null. */
export async function guardAdmin(req: NextRequest | Request): Promise<NextResponse | null> {
  if (await hasValidSession(req)) return null;
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
