'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/games', label: 'Games', icon: '♥' },
  { href: '/friends', label: 'Friends', icon: '⇄' },
  { href: '/stats', label: 'Stats', icon: '⌗' },
  { href: '/settings', label: 'Settings', icon: '⋮⋮' },
];

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="ds-tabbar">
      {TABS.map((tab) => {
        const isOn = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link key={tab.href} href={tab.href} className={`ds-tab ${isOn ? 'ds-tab--on' : ''}`}>
            <span style={{ fontSize: 15 }}>{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
