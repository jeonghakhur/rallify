'use client';

import ScheduleDetailAdmin from '@/components/schedule/ScheduleDetailAdmin';
import ScheduleDetailUser from '@/components/schedule/ScheduleDetailUser';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { use } from 'react';

type Props = {
  params: Promise<{ id: string }>; // params가 Promise로 감싸져 있음
};

export default function Page({ params }: Props) {
  const { user, isLoading } = useAuthRedirect('/auth/signin/', 1);
  const { id } = use(params); // params를 비동기로 처리
  console.log(user);
  if (isLoading) return null;

  if (user) {
    return user.level >= 2 ? (
      <ScheduleDetailAdmin scheduleId={id} user={user!} />
    ) : (
      <ScheduleDetailUser scheduleId={id} user={user!} />
    );
  }

  return null;
}
