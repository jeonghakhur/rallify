'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname() || '';
  const router = useRouter();
  const isSignin = pathname?.includes('/auth/signin');

  const user = session?.user;
  const role = user?.role || 'PENDING';
  const [largeFont, setLargeFont] = useState<null | boolean>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="print-hidden px-6 py-3">
      {status === 'loading' ? (
        // 로딩 중일 때 동일한 높이를 유지하는 스켈레톤
        <div className="flex items-center">
          <div className="flex gap-x-3 text-lg font-bold">
            <div className="text-lg font-bold pb-0.5 border-b-2 border-transparent">
              <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
            <div className="text-lg font-bold pb-0.5 border-b-2 border-transparent">
              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
            <div className="text-lg font-bold pb-0.5 border-b-2 border-transparent">
              <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
          </div>
          <div className="ml-auto">
            <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <ul className="flex gap-x-3 text-lg font-bold h-[43px] items-center">
            <li>
              <Link
                href="/"
                className={
                  'relative pb-0.5 ' +
                  (pathname === '/'
                    ? 'border-b-2 border-blue-600 transition-all duration-300 ease-in-out'
                    : 'border-b-2 border-transparent transition-all duration-300 ease-in-out')
                }
              >
                홈
              </Link>
            </li>
            {role !== 'PENDING' && (
              <>
                <li>
                  <Link
                    href="/schedule"
                    className={
                      'relative pb-0.5 ' +
                      (pathname.startsWith('/schedule')
                        ? 'border-b-2 border-blue-600 transition-all duration-300 ease-in-out'
                        : 'border-b-2 border-transparent transition-all duration-300 ease-in-out')
                    }
                  >
                    일정
                  </Link>
                </li>
                <li>
                  <Link
                    href="/games"
                    className={
                      'relative pb-0.5 ' +
                      (pathname.startsWith('/games')
                        ? 'border-b-2 border-blue-600 transition-all duration-300 ease-in-out'
                        : 'border-b-2 border-transparent transition-all duration-300 ease-in-out')
                    }
                  >
                    게임
                  </Link>
                </li>
                <li>
                  <Link
                    href="/clubs"
                    className={
                      'relative pb-0.5 ' +
                      (pathname.startsWith('/clubs')
                        ? 'border-b-2 border-blue-600 transition-all duration-300 ease-in-out'
                        : 'border-b-2 border-transparent transition-all duration-300 ease-in-out')
                    }
                  >
                    클럽
                  </Link>
                </li>
              </>
            )}
            {role === 'SUPER_ADMIN' && (
              <>
                <li>
                  <Link
                    href="/admin/members"
                    className={
                      'relative pb-0.5 ' +
                      (pathname.startsWith('/admin/members')
                        ? 'border-b-2 border-blue-600 transition-all duration-300 ease-in-out'
                        : 'border-b-2 border-transparent transition-all duration-300 ease-in-out')
                    }
                  >
                    회원관리
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/club-applications"
                    className={
                      'relative pb-0.5 ' +
                      (pathname.startsWith('/admin/club-applications')
                        ? 'border-b-2 border-blue-600 transition-all duration-300 ease-in-out'
                        : 'border-b-2 border-transparent transition-all duration-300 ease-in-out')
                    }
                  >
                    클럽신청
                  </Link>
                </li>
              </>
            )}
          </ul>
          {!isSignin && (
            <div className="ml-auto">
              {user ? (
                <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="사용자 메뉴"
                      className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Image
                        src={user.image ?? '/default_profile.png'}
                        width={36}
                        height={36}
                        alt={`${user.name} profile image`}
                        className="rounded-full"
                        priority
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-40 p-1"
                  >
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/user');
                      }}
                    >
                      프로필 보기
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 text-red-600"
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
      )}
    </div>
  );
}
