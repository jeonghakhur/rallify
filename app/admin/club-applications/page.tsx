'use client';

import { Container } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { useDialog } from '@/hooks/useDialog';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';

type Application = {
  memberId: string;
  clubId: string;
  clubName: string;
  clubJoinType: string;
  introduction: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    gender: string | null;
    phoneNumber: string | null;
    birthyear: string | null;
  };
};

function calcAge(birthyear: string | null): number | null {
  if (!birthyear) return null;
  const y = Number(birthyear);
  if (!Number.isFinite(y) || y < 1900) return null;
  return new Date().getFullYear() - y;
}

export default function AdminClubApplicationsPage() {
  const { user, isLoading } = useAuthRedirect('/', 'SUPER_ADMIN');
  const { confirm, alert } = useDialog();
  const { data: applications } = useSWR<Application[]>(
    user ? '/api/admin/club-applications' : null
  );

  const handleApprove = async (app: Application) => {
    const ok = await confirm({
      title: '가입 승인',
      description: `${app.user.name ?? '신청자'}의 ${app.clubName} 가입을 승인할까요?`,
      confirmText: '승인',
    });
    if (!ok) return;
    const res = await fetch(
      `/api/clubs/${app.clubId}/members/${app.memberId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      await alert({
        title: '승인 실패',
        description: data.error ?? '처리 중 오류가 발생했습니다.',
      });
      return;
    }
    mutate('/api/admin/club-applications');
  };

  const handleReject = async (app: Application) => {
    const ok = await confirm({
      title: '가입 거절',
      description: `${app.user.name ?? '신청자'}의 ${app.clubName} 가입을 거절할까요?`,
      confirmText: '거절',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(
      `/api/clubs/${app.clubId}/members/${app.memberId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      await alert({
        title: '거절 실패',
        description: data.error ?? '처리 중 오류가 발생했습니다.',
      });
      return;
    }
    mutate('/api/admin/club-applications');
  };

  if (isLoading) return null;

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">클럽 가입 신청</h1>
        <Link
          href="/admin/members"
          className="text-sm text-blue-600 hover:underline"
        >
          회원 관리로 →
        </Link>
      </div>

      {!applications ? (
        <p className="text-gray-400 text-center py-12">불러오는 중…</p>
      ) : applications.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          대기 중인 클럽 가입 신청이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const age = calcAge(app.user.birthyear);
            return (
              <div
                key={app.memberId}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/clubs/${app.clubId}/manage`}
                        className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {app.clubName}
                      </Link>
                      <span className="text-xs text-gray-400">
                        {format(new Date(app.createdAt), 'MM/dd HH:mm', {
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-medium text-gray-800">
                        {app.user.name ?? '(이름 없음)'}
                      </span>
                      {app.user.gender && (
                        <span className="text-xs text-gray-500">
                          {app.user.gender}
                        </span>
                      )}
                      {app.user.birthyear && (
                        <span className="text-xs text-gray-500">
                          {app.user.birthyear}
                          {age !== null && ` (만 ${age}세)`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {app.user.email}
                      {app.user.phoneNumber && ` · ${app.user.phoneNumber}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleApprove(app)}>
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => handleReject(app)}
                    >
                      거절
                    </Button>
                  </div>
                </div>

                {app.introduction && (
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-2 whitespace-pre-wrap">
                    {app.introduction}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
