import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'ぷてぃえーる',
  description: '受注管理',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fbf7f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
