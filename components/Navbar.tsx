'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import UserAvatar from './UserAvatar';

const THEME_OPTIONS = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
] as const;

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname() || '';
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isSignin = pathname?.includes('/auth/signin');

  const user = session?.user;
  const [largeFont, setLargeFont] = useState<null | boolean>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // 마운트 후 localStorage에서 값 동기화
  useEffect(() => {
    const saved = localStorage.getItem('bigFont');
    if (saved === 'true') setLargeFont(true);
    else if (saved === 'false') setLargeFont(false);
    else setLargeFont(false);
  }, []);

  // 큰글씨 상태를 html에 반영하고 localStorage에 저장
  useEffect(() => {
    if (largeFont !== null) {
      const html = document.documentElement;
      if (largeFont) html.classList.add('big-font');
      else html.classList.remove('big-font');

      localStorage.setItem('bigFont', String(largeFont));
    }
  }, [largeFont]);

  return (
    <div className="print-hidden sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="flex h-14 items-center px-5">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-foreground"
        >
          rallify-tennis<span className="text-accent dark:text-ball">.</span>
        </Link>

        {!isSignin && (
          <div className="ml-auto">
            {status === 'loading' ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="사용자 메뉴"
                    className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <UserAvatar name={user.name} image={user.image} size={36} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="w-44 p-1">
                  <button
                    type="button"
                    className="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push('/user');
                    }}
                  >
                    프로필 보기
                  </button>
                  {user.role === 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/admin/members');
                      }}
                    >
                      회원 관리
                    </button>
                  )}
                  <div className="my-1 border-t border-border" />
                  <div className="px-3 pb-1 pt-1.5 text-xs font-semibold text-muted-foreground">
                    테마
                  </div>
                  <div className="flex gap-1 px-2 pb-1.5">
                    {THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={
                          'flex-1 rounded-md px-1 py-1.5 text-xs font-semibold ' +
                          (mounted && theme === opt.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground')
                        }
                        onClick={() => setTheme(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="w-full rounded px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                  >
                    로그아웃
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Button type="button" variant="link" onClick={() => signIn()}>
                로그인
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
