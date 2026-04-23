import { NextRequest, NextResponse } from 'next/server';
import { readProfile, writeProfile } from '@/lib/profile-server';
import type { Profile } from '@/types/profile';
import { guardDev } from '../_guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const blocked = guardDev();
  if (blocked) return blocked;
  return NextResponse.json(await readProfile());
}

export async function PUT(req: NextRequest) {
  const blocked = guardDev();
  if (blocked) return blocked;
  const body = (await req.json()) as Profile;
  await writeProfile(body);
  return NextResponse.json(body);
}
