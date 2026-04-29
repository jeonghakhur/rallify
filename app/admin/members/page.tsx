'use client';

import { useState } from 'react';
import { Container } from '@/components/Layout';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDialog } from '@/hooks/useDialog';
import { getUserLevelLabel } from '@/lib/userLevel';
import MemberEditDialog from '@/components/admin/MemberEditDialog';

type Member = {
  id: string;
  name: string | null;
  email: string | null;
  gender: string | null;
  level: number;
  role: string;
  provider: string | null;
  createdAt: string;
  address: string | null;
  birthday: string | null;
  birthyear: string | null;
};

export default function AdminMembersPage() {
  const { user, isLoading } = useAuthRedirect('/', 'SUPER_ADMIN');
  const { confirm, alert } = useDialog();
  const [tab, setTab] = useState<'pending' | 'active'>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: pendingMembers } = useSWR<Member[]>(
    user ? '/api/admin/members?status=pending' : null
  );
  const { data: allMembers } = useSWR<Member[]>(
    user && tab === 'active' ? '/api/admin/members' : null
  );

  const activeMembers = allMembers?.filter((m) => m.role !== 'PENDING') ?? [];

  const handleApprove = async (id: string) => {
    await fetch(`/api/admin/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 1 }),
    });
    mutate('/api/admin/members?status=pending');
  };

  const handleReject = async (id: string, name: string | null) => {
    const ok = await confirm({
      title: '가입 거절',
      description: `${name ?? '이 회원'}의 가입을 거절하고 계정을 삭제할까요?`,
      confirmText: '거절',
      destructive: true,
    });
    if (!ok) return;
    await fetch(`/api/admin/members/${id}`, { method: 'DELETE' });
    mutate('/api/admin/members?status=pending');
  };

  const handleDelete = async (id: string, name: string | null) => {
    const ok = await confirm({
      title: '회원 삭제',
      description: `${name ?? '이 회원'}의 계정을 삭제할까요?\n관련 데이터도 함께 삭제됩니다.`,
      confirmText: '삭제',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/members/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      await alert({
        title: '삭제 실패',
        description: data.error ?? '삭제에 실패했습니다.',
      });
      return;
    }
    mutate('/api/admin/members');
  };

  if (isLoading) return null;

  return (
    <Container>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">회원 관리</h1>

      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'pending'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('pending')}
        >
          가입 대기{' '}
          {pendingMembers && pendingMembers.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {pendingMembers.length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'active'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('active')}
        >
          활성 회원
        </button>
      </div>

      {tab === 'pending' && (
        <div className="space-y-3">
          {!pendingMembers || pendingMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              대기 중인 가입 신청이 없습니다.
            </p>
          ) : (
            pendingMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">
                    {member.name ?? '(이름 없음)'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {member.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {member.gender ?? '-'} · {member.provider ?? 'email'} ·{' '}
                    {format(new Date(member.createdAt), 'MM/dd HH:mm', {
                      locale: ko,
                    })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => handleApprove(member.id)}>
                    승인
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => handleReject(member.id, member.name)}
                  >
                    거절
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'active' && (
        <div className="space-y-3">
          {activeMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              활성 회원이 없습니다.
            </p>
          ) : (
            activeMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setEditingId(member.id)}
                    className="font-medium text-gray-800 hover:text-blue-600 hover:underline text-left"
                  >
                    {member.name}
                  </button>
                  <p className="text-sm text-gray-500 truncate">
                    {member.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {member.gender ?? '-'} · {getUserLevelLabel(member.level)}{' '}
                    (Lv.{member.level})
                  </p>
                  {(member.address || member.birthday || member.birthyear) && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {member.address && <span>거주 {member.address}</span>}
                      {member.address &&
                        (member.birthday || member.birthyear) &&
                        ' · '}
                      {(member.birthday || member.birthyear) && (
                        <span>생년 {member.birthday || member.birthyear}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(member.id)}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(member.id, member.name)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <MemberEditDialog
        memberId={editingId}
        onClose={() => setEditingId(null)}
      />
    </Container>
  );
}
