'use client';

import { Container } from '@/components/Layout';
import LoadingGrid from '@/components/LoadingGrid';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { UserProps } from '@/model/user';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

export default function Page() {
  const { isLoading } = useAuthRedirect('/', 4);

  const { data: members } = useSWR<UserProps[]>('/api/members');

  const [loading, setLoading] = useState<boolean>(isLoading);
  useEffect(() => {
    if (members) {
      setLoading(false);
    }
  }, [members]);

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
                <th>성별</th>
                <th>거주지</th>
                <th>출생년도</th>
                <th>레벨</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member, idx) => (
                <tr key={member.id}>
                  <td>{members.length - idx}</td>
                  <td>
                    <Link href={`/members/${member.id}`}>{member.name}</Link>
                  </td>
                  <td>{member.gender}</td>
                  <td>{member.address}</td>
                  <td>{member.birthyear}</td>
                  <td>{member.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
