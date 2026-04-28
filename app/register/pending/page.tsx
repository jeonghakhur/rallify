'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function RegisterPendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user.role !== 'PENDING') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') return null;

  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2">가입 신청 완료</h1>
        <p className="text-gray-500 text-sm mb-1">
          <span className="font-medium text-gray-700">
            {session?.user.name}
          </span>
          님, 가입 신청이 완료되었습니다.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          관리자 승인 후 서비스를 이용하실 수 있습니다.
          <br />
          승인까지 1~2일 소요될 수 있습니다.
        </p>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        >
          로그아웃
        </Button>
      </div>
    </section>
  );
}
