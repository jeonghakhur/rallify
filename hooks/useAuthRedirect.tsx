'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function useAuthRedirect(
  redirectTo: string = '/auth/signin',
  minLevel: number = 0
) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.level < minLevel) {
      router.push(redirectTo);
    } else {
      setIsChecking(false);
    }
  }, [session, status, router, redirectTo, minLevel]);

  return { user: session?.user, isLoading: isChecking };
}
