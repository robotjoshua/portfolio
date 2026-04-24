import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_session';

function getSecret(): Uint8Array | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload.sub === 'admin';
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Public auth endpoints — always open
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth/')) {
    return NextResponse.next();
  }

  // Only guard admin surface area
  const guarded = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (!guarded) return NextResponse.next();

  if (await isAuthed(req)) return NextResponse.next();

  // API routes → 401 JSON
  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Page routes → redirect to login
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = `?from=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
