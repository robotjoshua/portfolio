import { NextResponse } from 'next/server';

/** Returns a 404 response if not in dev, else null. Admin is localhost-only. */
export function guardDev(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }
  return null;
}
