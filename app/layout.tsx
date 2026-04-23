import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { DarkProvider } from '@/components/providers';
import { Nav } from '@/components/Nav';
import { TermBar } from '@/components/TermBar';
import { DataTicker } from '@/components/DataTicker';
import './globals.css';

export const metadata: Metadata = {
  title: 'Joshua Powell · Prop Archive',
  description: 'Prop fabrication archive for film, TV, and conventions.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <DarkProvider>
          <Nav />
          <div className="shell">{children}</div>
          <TermBar />
          <DataTicker />
        </DarkProvider>
      </body>
    </html>
  );
}
