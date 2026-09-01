import Link from 'next/link';

const TABS = [
  { href: '/', label: 'きょう' },
  { href: '/orders', label: '注文' },
  { href: '/record', label: 'きろく' },
] as const;

/**
 * デモのタブは4つですが、③文章をつくる はまだ無いので出していません。
 * 押しても何も起きないタブは、迷う時間を作るだけです。
 */
export function TabBar({ current }: { current: string }) {
  return (
    <nav className="tabbar" aria-label="画面">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={tab.href === current}>
          <span className="dot" />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
