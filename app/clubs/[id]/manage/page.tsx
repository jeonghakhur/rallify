'use client';

import { use, useState } from 'react';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { useDialog } from '@/hooks/useDialog';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type Member = {
  id: string;
  role: string;
  status: string;
  introduction: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string | null;
  };
};

type ClubDetail = {
  id: string;
  name: string;
  description: string | null;
  joinType: string;
  myMembership: { role: string } | null;
};

export default function ClubManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuthRedirect();
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const { data: club } = useSWR<ClubDetail>(`/api/clubs/${id}`);
  const [tab, setTab] = useState<'pending' | 'invited' | 'active' | 'settings'>(
    'pending'
  );
  const [inviteQuery, setInviteQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; username: string; image: string | null }[]
  >([]);

  const myRole = club?.myMembership?.role;
  const isOwner = myRole === 'OWNER';
  const isAdmin =
    isOwner || myRole === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  // Fetch members by status
  const { data: pendingMembers } = useSWR<Member[]>(
    isAdmin ? `/api/clubs/${id}?_members=pending` : null,
    async () => {
      const res = await fetch(`/api/clubs/${id}`);
      const data = await res.json();
      return data.members?.filter((m: Member) => m.status === 'PENDING') ?? [];
    }
  );

  const fetchAllMembers = async () => {
    const res = await fetch(`/api/clubs/${id}`);
    const data = await res.json();
    return data;
  };

  const { data: fullClub } = useSWR(
    isAdmin ? `club-manage-${id}` : null,
    fetchAllMembers
  );
  const allMembers: Member[] = fullClub?.members ?? [];
  const invitedMembers = allMembers.filter(
    (m: Member) => m.status === 'INVITED'
  );
  const activeMembers = allMembers.filter((m: Member) => m.status === 'ACTIVE');

  const handleApprove = async (memberId: string) => {
    await fetch(`/api/clubs/${id}/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    mutate(`club-manage-${id}`);
    mutate(`/api/clubs/${id}`);
  };

  const handleReject = async (memberId: string) => {
    const reason = prompt('거절 사유 (선택)');
    await fetch(`/api/clubs/${id}/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'REJECTED',
        statusReason: reason || undefined,
      }),
    });
    mutate(`club-manage-${id}`);
  };

  const handleRemove = async (memberId: string) => {
    const ok = await confirm({
      title: '멤버 강퇴',
      description: '정말 이 멤버를 강퇴하시겠습니까?',
      confirmText: '강퇴',
      destructive: true,
    });
    if (!ok) return;
    await fetch(`/api/clubs/${id}/members/${memberId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '관리자에 의한 강퇴' }),
    });
    mutate(`club-manage-${id}`);
    mutate(`/api/clubs/${id}`);
  };

  const handleRoleChange = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'MEMBER' ? 'MANAGER' : 'MEMBER';
    const ok = await confirm({
      title: '역할 변경',
      description: `역할을 ${newRole === 'MANAGER' ? '매니저' : '회원'}(으)로 변경하시겠습니까?`,
      confirmText: '변경',
    });
    if (!ok) return;
    await fetch(`/api/clubs/${id}/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    mutate(`club-manage-${id}`);
    mutate(`/api/clubs/${id}`);
  };

  const handleSearch = async () => {
    if (inviteQuery.trim().length < 2) return;
    const res = await fetch(
      `/api/users/search?q=${encodeURIComponent(inviteQuery)}`
    );
    const data = await res.json();
    setSearchResults(data);
  };

  const handleInvite = async (userId: string) => {
    const res = await fetch(`/api/clubs/${id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      await alert({ title: '초대 실패', description: data.error });
      return;
    }
    setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    mutate(`club-manage-${id}`);
  };

  const handleDeleteClub = async () => {
    const ok = await confirm({
      title: '클럽 삭제',
      description:
        '정말 클럽을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      destructive: true,
    });
    if (!ok) return;
    await fetch(`/api/clubs/${id}`, { method: 'DELETE' });
    router.push('/clubs');
  };

  if (authLoading) return null;
  if (!isAdmin)
    return (
      <div className="p-4 text-center text-gray-400">접근 권한이 없습니다.</div>
    );

  const tabs = [
    { key: 'pending', label: `대기 (${pendingMembers?.length ?? 0})` },
    { key: 'invited', label: `초대 (${invitedMembers.length})` },
    { key: 'active', label: `멤버 (${activeMembers.length})` },
    ...(isOwner ? [{ key: 'settings', label: '설정' }] : []),
  ] as const;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">{club?.name} 관리</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 가입 대기 */}
      {tab === 'pending' && (
        <div className="space-y-2">
          {!pendingMembers || pendingMembers.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              대기 중인 가입 신청이 없습니다.
            </p>
          ) : (
            pendingMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <div>
                  <span className="font-medium text-sm">{m.user.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {m.user.email}
                  </span>
                  {m.introduction && (
                    <p className="text-xs text-gray-500 mt-1">
                      {m.introduction}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(m.id)}>
                    승인
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(m.id)}
                  >
                    거절
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 초대 대기 + 멤버 초대 */}
      {tab === 'invited' && (
        <div className="space-y-4">
          {/* 초대 검색 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">멤버 초대</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="이름 또는 이메일로 검색"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <Button size="sm" onClick={handleSearch}>
                검색
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50"
                  >
                    <span className="text-sm">
                      {u.name}{' '}
                      <span className="text-gray-400">@{u.username}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInvite(u.id)}
                    >
                      초대
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 초대 목록 */}
          {invitedMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              초대 대기 중인 멤버가 없습니다.
            </p>
          ) : (
            invitedMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <span className="text-sm">
                  {m.user.name}{' '}
                  <span className="text-gray-400">@{m.user.username}</span>
                </span>
                <span className="text-xs text-amber-500">초대 대기</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* 활성 멤버 */}
      {tab === 'active' && (
        <div className="space-y-2">
          {activeMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  {m.user.name?.[0] || '?'}
                </div>
                <div>
                  <span className="text-sm font-medium">{m.user.name}</span>
                  <span className="text-xs text-gray-400 ml-1">
                    {m.role === 'OWNER'
                      ? '소유자'
                      : m.role === 'MANAGER'
                        ? '매니저'
                        : '회원'}
                  </span>
                </div>
              </div>
              {isOwner && m.role !== 'OWNER' && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRoleChange(m.id, m.role)}
                  >
                    {m.role === 'MEMBER' ? '매니저로' : '회원으로'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500"
                    onClick={() => handleRemove(m.id)}
                  >
                    강퇴
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 설정 */}
      {tab === 'settings' && isOwner && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">클럽 정보</h3>
            <p className="text-xs text-gray-400">
              클럽 정보 수정 기능은 추후 업데이트 예정입니다.
            </p>
          </div>

          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="text-sm font-semibold text-red-600 mb-2">
              위험 구역
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              클럽을 삭제하면 모든 멤버 데이터가 함께 삭제됩니다.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-100"
              onClick={handleDeleteClub}
            >
              클럽 삭제
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
