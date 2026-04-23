'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface DarkCtx {
  dark: boolean;
  toggle: () => void;
}

const Ctx = createContext<DarkCtx>({ dark: false, toggle: () => {} });

export function DarkProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jp-dark');
      if (stored === '1') setDark(true);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.setAttribute('data-dark', '1');
    else document.documentElement.removeAttribute('data-dark');
    try {
      localStorage.setItem('jp-dark', dark ? '1' : '0');
    } catch { /* ignore */ }
  }, [dark]);

  return <Ctx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</Ctx.Provider>;
}

export function useDark() {
  return useContext(Ctx);
}
