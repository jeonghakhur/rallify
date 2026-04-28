'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const REGISTER_PATHS = ['/register', '/register/pending'];

export default function useAuthRedirect(
  redirectTo: string = '/auth/signin',
  requiredRole?: 'SUPER_ADMIN'
) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    const role = session.user.role ?? 'PENDING';
    const name = session.user.name;

    // PENDING: 가입 대기 상태 리디렉션
    if (role === 'PENDING') {
      if (!name && pathname !== '/register') {
        router.push('/register');
      } else if (name && !REGISTER_PATHS.includes(pathname)) {
        router.push('/register/pending');
      } else {
        setIsChecking(false);
      }
      return;
    }

    if (requiredRole === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      router.push(redirectTo);
    } else {
      setIsChecking(false);
    }
  }, [session, status, router, redirectTo, requiredRole, pathname]);

  return { user: session?.user, isLoading: isChecking };
}
