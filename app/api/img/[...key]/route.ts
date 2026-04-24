import { NextResponse } from 'next/server';
import { getImage } from '@/lib/blobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ key: string[] }> };

export async function GET(_req: Request, ctx: Ctx): Promise<Response> {
  const { key } = await ctx.params;
  if (!key?.length) return new NextResponse('Not found', { status: 404 });
  const joined = key.map((seg) => decodeURIComponent(seg)).join('/');
  // Simple traversal guard
  if (joined.includes('..')) return new NextResponse('Bad request', { status: 400 });

  const hit = await getImage(joined);
  if (!hit) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(hit.body as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': hit.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
