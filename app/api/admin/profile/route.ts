import { NextRequest, NextResponse } from 'next/server';
import { readProfile, writeProfile } from '@/lib/profile-server';
import type { Profile } from '@/types/profile';
import { guardAdmin } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;
  return NextResponse.json(await readProfile());
}

export async function PUT(req: NextRequest) {
  const blocked = await guardAdmin(req);
  if (blocked) return blocked;
  const body = (await req.json()) as Profile;
  await writeProfile(body);
  return NextResponse.json(body);
}
