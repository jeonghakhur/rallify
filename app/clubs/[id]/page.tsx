'use client';

import { use } from 'react';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { useDialog } from '@/hooks/useDialog';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import JoinApplicationDialog from '@/components/club/JoinApplicationDialog';

type ClubMember = {
  id: string;
  role: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

type ClubDetail = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  district: string | null;
  joinType: string;
  maxMembers: number | null;
  memberCount: number;
  isActive: boolean;
  members: ClubMember[];
  myMembership: { id: string; role: string; status: string } | null;
};

const joinTypeLabel: Record<string, string> = {
  OPEN: '자유 가입',
  APPROVAL: '승인 필요',
  INVITE_ONLY: '초대 전용',
};

const roleLabel: Record<string, string> = {
  OWNER: '소유자',
  MANAGER: '매니저',
  MEMBER: '회원',
};

export default function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isLoading: authLoading } = useAuthRedirect();
  const { data: club, isLoading } = useSWR<ClubDetail>(`/api/clubs/${id}`);
  const { confirm } = useDialog();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [responding, setResponding] = useState(false);

  const handleRespond = async (accept: boolean) => {
    if (!club?.myMembership) return;
    setResponding(true);
    try {
      await fetch(`/api/clubs/${id}/members/${club.myMembership.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });
      mutate(`/api/clubs/${id}`);
    } finally {
      setResponding(false);
    }
  };

  const handleLeave = async () => {
    if (!club?.myMembership) return;
    const ok = await confirm({
      title: '클럽 나가기',
      description: '정말 클럽을 나가시겠습니까?',
      confirmText: '나가기',
      destructive: true,
    });
    if (!ok) return;
    await fetch(`/api/clubs/${id}/members/${club.myMembership.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    mutate(`/api/clubs/${id}`);
  };

  if (authLoading || isLoading)
    return <div className="p-4 text-center text-gray-400">로딩 중...</div>;
  if (!club)
    return (
      <div className="p-4 text-center text-gray-400">
        클럽을 찾을 수 없습니다.
      </div>
    );

  const myStatus = club.myMembership?.status;
  const myRole = club.myMembership?.role;
  const isAdmin = myRole === 'OWNER' || myRole === 'MANAGER';

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      {/* 클럽 정보 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{club.name}</h1>
            {club.description && (
              <p className="text-sm text-gray-500 mt-1">{club.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-400">
              {club.city && (
                <span>
                  {club.city} {club.district}
                </span>
              )}
              <span>멤버 {club.memberCount}명</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                {joinTypeLabel[club.joinType]}
              </span>
            </div>
          </div>
          {isAdmin && (
            <Link href={`/clubs/${id}/manage`}>
              <Button variant="outline" size="sm">
                관리
              </Button>
            </Link>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {!club.myMembership && (
            <Button onClick={() => setJoinDialogOpen(true)} className="w-full">
              가입 신청
            </Button>
          )}
          {myStatus === 'PENDING' && (
            <div className="text-center text-sm text-amber-600 bg-amber-50 rounded-md py-2">
              승인 대기 중입니다.
            </div>
          )}
          {myStatus === 'INVITED' && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleRespond(true)}
                disabled={responding}
                className="flex-1"
              >
                수락
              </Button>
              <Button
                onClick={() => handleRespond(false)}
                disabled={responding}
                variant="outline"
                className="flex-1"
              >
                거절
              </Button>
            </div>
          )}
          {myStatus === 'ACTIVE' && myRole !== 'OWNER' && (
            <Button
              onClick={handleLeave}
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              클럽 나가기
            </Button>
          )}
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-semibold text-gray-800 mb-3">
          멤버 ({club.memberCount})
        </h2>
        <div className="space-y-2">
          {club.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                  {member.user.name?.[0] || '?'}
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {member.user.name}
                  </span>
                  {member.user.username && (
                    <span className="text-xs text-gray-400 ml-1">
                      @{member.user.username}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {roleLabel[member.role] || member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <JoinApplicationDialog
        clubId={id}
        clubName={club.name}
        open={joinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        onSuccess={() => mutate(`/api/clubs/${id}`)}
      />
    </main>
  );
}
