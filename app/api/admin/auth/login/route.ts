import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, ONE_WEEK_SECONDS, createSessionToken, timingSafeEqual } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const first = fwd.split(',')[0]?.trim();
  if (first) return first;
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD is not configured on the server' },
      { status: 503 },
    );
  }

  const key = clientKey(req);
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: 'too many attempts; try again later' }, { status: 429 });
  }

  let password = '';
  try {
    const body = (await req.json()) as { password?: string };
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  if (!timingSafeEqual(password, expected)) {
    return NextResponse.json({ error: 'wrong password' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_WEEK_SECONDS,
  });
  return res;
}
