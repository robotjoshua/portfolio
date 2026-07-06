import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_session';
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'ADMIN_SESSION_SECRET is missing or too short. Generate one with: openssl rand -base64 48'
    );
  }
  return new TextEncoder().encode(s);
}

export interface AdminSession {
  sub: 'admin';
  iat: number;
  exp: number;
}

export async function createSessionToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + ONE_WEEK_SECONDS)
    .sign(getSecret());
}

export async function verifySessionToken(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (payload.sub !== 'admin') return null;
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function hasValidSession(req: NextRequest | Request): Promise<boolean> {
  const token = readCookie(req, COOKIE_NAME);
  return (await verifySessionToken(token)) !== null;
}

/** Server-component helper: reads the admin cookie via next/headers. */
export async function isAdminServer(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return (await verifySessionToken(token)) !== null;
}

export function readCookie(req: NextRequest | Request, name: string): string | undefined {
  const header = req.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export { COOKIE_NAME, ONE_WEEK_SECONDS };

/** Constant-time string compare for password matching. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
