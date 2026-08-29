import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ClientRoot } from './client-root';

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hearts Score Keeper',
  description: 'Keep score at the table, together.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0708',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
