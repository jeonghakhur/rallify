'use client';

import { GetScheduleProps } from '@/model/schedule';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Props = {
  selectedSchedule?: GetScheduleProps | null;
};

export default function LatestPendingSchedule({ selectedSchedule }: Props) {
  const router = useRouter();
  const schedule = selectedSchedule;
  const { data: session } = useSession();
  if (!schedule) return null;

  const getWorkoutInfo = (schedule: GetScheduleProps) => {
    const uniquePlayers = new Set(
      schedule.attendees?.map((attendee) => attendee.name) || []
    );

    return {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      totalPlayers: uniquePlayers.size,
      courtCount: schedule.courtCount,
    };
  };

  const workoutInfo = getWorkoutInfo(schedule);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 print-hidden">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">다음게임일정</h3>
        <div className="text-sm text-gray-600 text-right">
          {format(new Date(schedule.date), 'yy년MM월dd일(EEE)', {
            locale: ko,
          })}
          <br />
          {schedule.courtName}
        </div>
      </div>

      {workoutInfo && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">시간</p>
            <p className="text-lg font-bold text-blue-600">
              {workoutInfo.startTime}-{workoutInfo.endTime}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">총 참석자</p>
            <p className="text-lg font-bold text-orange-600">
              {workoutInfo.totalPlayers}명
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">코트</p>
            <p className="text-lg font-bold text-green-600">
              {Array.isArray(schedule.courtNumbers)
                ? schedule.courtNumbers
                    .map((cn) =>
                      typeof cn === 'object' && cn.number ? cn.number : cn
                    )
                    .join(', ')
                : '0'}
            </p>
          </div>
        </div>
      )}

      {schedule.status === 'done' ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => router.push(`/games/${schedule.id}`)}
            className="flex-1"
          >
            게임결과보기
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => router.push(`/schedule/${schedule.id}`)}
            className="flex-1"
          >
            참석투표
          </Button>

          {session && session.user && session.user.level >= 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/match/${schedule.id}`)}
              className="flex-1"
            >
              대진표작성
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
