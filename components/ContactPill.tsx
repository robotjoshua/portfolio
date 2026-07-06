'use client';
import { useRef, useState } from 'react';

type Status = 'idle' | 'clicked' | 'copied';

export function ContactPill({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Letting the browser navigate to mailto: immediately can reset this
    // component's state before the feedback ever paints — with no mail
    // client registered, some browsers treat the failed hand-off as a
    // navigation attempt and reload the page, wiping the "clicked" state
    // in the same tick. So: show feedback first, then hand off to
    // mailto: a beat later once it's had a chance to render.
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    setStatus('clicked');
    navigator.clipboard?.writeText(email).then(
      () => setStatus('copied'),
      () => {},
    );
    setTimeout(() => {
      window.location.href = `mailto:${email}`;
    }, 250);
    timer.current = setTimeout(() => setStatus('idle'), 2400);
  }

  const label = status === 'copied' ? 'Copied ✓' : status === 'clicked' ? 'Opening mail…' : 'Get in touch →';

  return (
    <a className="pill a" href={`mailto:${email}`} onClick={handleClick}>
      {label}
    </a>
  );
}
