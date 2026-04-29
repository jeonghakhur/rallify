'use client';

import { Container } from '@/components/Layout';
import LoadingGrid from '@/components/LoadingGrid';
import { Button } from '@/components/ui/button';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { useDialog } from '@/hooks/useDialog';
import { UserProps } from '@/model/user';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';

type Member = UserProps & { role?: string };

export default function Page() {
  const { user, isLoading } = useAuthRedirect('/', 'SUPER_ADMIN');
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const { confirm, alert } = useDialog();

  const { data: members } = useSWR<Member[]>('/api/members');

  const [loading, setLoading] = useState<boolean>(isLoading);
  useEffect(() => {
    if (members) {
      setLoading(false);
    }
  }, [members]);

  const handleDelete = async (id: string, name: string) => {
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
    mutate('/api/members');
  };

  return (
    <Container className="px-5">
      {isLoading ? (
        <LoadingGrid loading={loading} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table whitespace-nowrap">
            <thead>
              <tr>
                <th>번호</th>
                <th>이름</th>
                {isAdmin && <th>이메일</th>}
                <th>성별</th>
                <th>거주지</th>
                <th>출생년도</th>
                <th>레벨</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member, idx) => {
                const isPending = member.role === 'PENDING';
                return (
                  <tr key={member.id}>
                    <td>{members.length - idx}</td>
                    <td>
                      <Link href={`/members/${member.id}`}>{member.name}</Link>
                    </td>
                    {isAdmin && (
                      <td className="text-gray-600">{member.email ?? '-'}</td>
                    )}
                    <td>{member.gender}</td>
                    <td>{member.address}</td>
                    <td>{member.birthyear}</td>
                    <td>{member.level}</td>
                    <td>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          isPending
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {isPending ? '가입 대기' : '활성'}
                      </span>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(member.id, member.name)}
                      >
                        삭제
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
