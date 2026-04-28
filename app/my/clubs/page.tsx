'use client';

import useAuthRedirect from '@/hooks/useAuthRedirect';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type MyClub = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  district: string | null;
  memberCount: number;
  myRole: string;
  myStatus: string;
  memberId: string;
};

const statusLabel: Record<string, { text: string; className: string }> = {
  ACTIVE: { text: '가입됨', className: 'text-green-600 bg-green-50' },
  PENDING: { text: '승인 대기', className: 'text-amber-600 bg-amber-50' },
  INVITED: { text: '초대됨', className: 'text-blue-600 bg-blue-50' },
};

const roleLabel: Record<string, string> = {
  OWNER: '소유자',
  MANAGER: '매니저',
  MEMBER: '회원',
};

export default function MyClubsPage() {
  const { isLoading: authLoading } = useAuthRedirect();
  const { data: clubs, isLoading } = useSWR<MyClub[]>('/api/my/clubs');

  if (authLoading || isLoading)
    return <div className="p-4 text-center text-gray-400">로딩 중...</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">내 클럽</h1>
        <Link href="/clubs">
          <Button variant="outline" size="sm">
            클럽 탐색
          </Button>
        </Link>
      </div>

      {!clubs || clubs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">가입한 클럽이 없습니다.</p>
          <Link href="/clubs">
            <Button>클럽 둘러보기</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => {
            const status = statusLabel[club.myStatus] || {
              text: club.myStatus,
              className: 'text-gray-500 bg-gray-50',
            };
            return (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-800">{club.name}</h2>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      {club.city && (
                        <span>
                          {club.city} {club.district}
                        </span>
                      )}
                      <span>멤버 {club.memberCount}명</span>
                      {club.myStatus === 'ACTIVE' && (
                        <span className="text-gray-500">
                          {roleLabel[club.myRole]}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${status.className}`}
                  >
                    {status.text}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
