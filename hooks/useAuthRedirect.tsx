'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function useAuthRedirect(
  redirectTo: string = '/auth/signin',
  requiredRole?: 'SUPER_ADMIN'
) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    const role = session.user.role ?? 'PENDING';

    // PENDING 세션은 더 이상 허용하지 않음 (구버전 잔존 세션 방어)
    if (role === 'PENDING') {
      signOut({ callbackUrl: '/auth/signin?error=PENDING_APPROVAL' });
      return;
    }

    if (requiredRole === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      router.push(redirectTo);
    } else {
      setIsChecking(false);
    }
  }, [session, status, router, redirectTo, requiredRole]);

  return { user: session?.user, isLoading: isChecking };
}
