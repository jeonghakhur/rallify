'use client';

import useAuthRedirect from '@/hooks/useAuthRedirect';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Club = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  district: string | null;
  joinType: string;
  memberCount: number;
  creatorName: string | null;
};

const joinTypeLabel: Record<string, string> = {
  OPEN: '자유 가입',
  APPROVAL: '승인 필요',
  INVITE_ONLY: '초대 전용',
};

export default function ClubsPage() {
  const { isLoading: authLoading } = useAuthRedirect();
  const { data: clubs, isLoading } = useSWR<Club[]>('/api/clubs');

  if (authLoading || isLoading)
    return <div className="p-4 text-center text-gray-400">로딩 중...</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">클럽 목록</h1>
        <Link href="/clubs/create">
          <Button size="sm">클럽 만들기</Button>
        </Link>
      </div>

      {!clubs || clubs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">아직 생성된 클럽이 없습니다.</p>
          <Link href="/clubs/create">
            <Button>첫 번째 클럽 만들기</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">{club.name}</h2>
                  {club.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {club.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {club.city && (
                      <span>
                        {club.city} {club.district}
                      </span>
                    )}
                    <span>멤버 {club.memberCount}명</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                  {joinTypeLabel[club.joinType] || club.joinType}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
