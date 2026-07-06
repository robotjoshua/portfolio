'use client';
import { useRouter } from 'next/navigation';

export function ArchiveBackButton() {
  const router = useRouter();
  return (
    <button type="button" className="arch-back" onClick={() => router.back()} aria-label="Go back">
      ← Back
    </button>
  );
}
