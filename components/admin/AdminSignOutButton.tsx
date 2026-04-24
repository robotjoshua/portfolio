'use client';
import { useState } from 'react';

export function AdminSignOutButton() {
  const [pending, setPending] = useState(false);
  async function signOut() {
    setPending(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {/* ignore */}
    window.location.href = '/admin/login';
  }
  return (
    <button type="button" className="adm-btn signout" onClick={signOut} disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
