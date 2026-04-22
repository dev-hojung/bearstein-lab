import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Josefin_Sans, Great_Vibes } from 'next/font/google';
import { BACKGROUNDS } from '@/lib/parts-data';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const josefin = Josefin_Sans({
  variable: '--font-josefin',
  subsets: ['latin'],
  weight: ['200', '300', '400', '600'],
});

const greatVibes = Great_Vibes({
  variable: '--font-great-vibes',
  subsets: ['latin'],
  weight: ['400'],
});

export const metadata: Metadata = {
  title: "베어슈타인의 가상 실험실",
  description: "Bearstein's Virtual Laboratory — a retro VHS/CRT bearparts assembly lab.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  // Allow scaling for accessibility (a11y improvement over original)
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const uniqueBgs = Array.from(new Set(Object.values(BACKGROUNDS)));

  return (
    <html
      lang="ko"
      className={`${cormorant.variable} ${josefin.variable} ${greatVibes.variable} antialiased h-full`}
    >
      <head>
        {uniqueBgs.map((href) => (
          <link key={href} rel="preload" as="image" href={href} fetchPriority="high" />
        ))}
      </head>
      <body className="h-full bg-[#FFD1DC]">{children}</body>
    </html>
  );
}
