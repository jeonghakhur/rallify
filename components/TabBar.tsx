'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const TABS = [
  {
    href: '/',
    label: '홈',
    match: (p: string) => p === '/',
    icon: <path d="M3 11L12 4l9 7v9h-6v-6h-6v6H3v-9z" strokeLinejoin="round" />,
  },
  {
    href: '/schedule',
    label: '일정',
    match: (p: string) => p.startsWith('/schedule'),
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    href: '/games',
    label: '게임',
    match: (p: string) => p.startsWith('/games') || p.startsWith('/match'),
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M4 6.5c3 1.5 5 3.5 5 5.5s-2 4-5 5.5M20 6.5c-3 1.5-5 3.5-5 5.5s2 4 5 5.5" />
      </>
    ),
  },
  {
    href: '/ranking',
    label: '랭킹',
    match: (p: string) => p.startsWith('/ranking'),
    icon: (
      <path
        d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M12 14v4M8 21h8"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function TabBar() {
  const { data: session } = useSession();
  const pathname = usePathname() || '';

  const role = session?.user?.role || 'PENDING';
  if (!session || role === 'PENDING' || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <nav
      aria-label="주요 메뉴"
      className="print-hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md"
    >
      <ul
        className="mx-auto grid max-w-md grid-cols-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[10px] font-bold ' +
                  (active
                    ? 'text-primary dark:text-accent'
                    : 'text-muted-foreground')
                }
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  {tab.icon}
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
