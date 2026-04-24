'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get('from') || '/admin';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'sign-in failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      router.replace(from.startsWith('/') ? from : '/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'sign-in failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <Link href="/" className="login-back">← Back to site</Link>
        <div className="login-tag">▣ ADMIN · 管理</div>
        <h1 className="login-title">Sign in</h1>
        <p className="login-hint">Enter the admin password to manage the archive.</p>
        <label className="login-field">
          <span className="login-k">Password</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            disabled={submitting}
          />
        </label>
        {error && <div className="login-err">{error}</div>}
        <button type="submit" className="login-btn" disabled={submitting || !password}>
          {submitting ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-wrap" />}>
      <LoginForm />
    </Suspense>
  );
}
