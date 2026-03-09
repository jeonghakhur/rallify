'use client';

import { Container } from '@/components/Layout';
import LatestGameResult from '@/components/LatestGameResult';
import LatestPendingSchedule from '@/components/LatestPendingSchedule';
import LatestMatchSchedule from '@/components/LatestMatchSchedule';
import StatsTable from '@/components/StatsTable';
import LatestGameRanking from '@/components/LatestGameRanking';
import useSWR from 'swr';
import { GetScheduleProps } from '@/model/schedule';
import CurrentPlayingGame from '@/components/CurrentPlayingGame';
import Skeleton from '@/components/common/Skeleton';
import { Calendar } from '@/components/ui/calendar';
import { useState, useEffect } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

export default function Home() {
  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(today, { weekStartsOn: 0 })
  );
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  // 인라인 데이트픽커용 상태
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // 게임 데이터 로딩 상태 확인
  const { isLoading: gamesLoading } = useSWR('/api/games?status=done');

  // 현재 진행중인 게임 데이터와 로딩 상태
  const {
    data: playingGameResult,
    isLoading: playingGameLoading,
    mutate: mutatePlayingGame,
  } = useSWR('/api/games/latest?status=playing');

  // 일정 데이터 불러오기
  const { data: schedules } = useSWR<GetScheduleProps[]>('/api/schedule');
  // 완료된 게임 날짜
  const doneDates = schedules
    ? schedules
        .filter((s) => s.status === 'done')
        .map((s) => new Date(s.date).toDateString())
    : [];
  // 완료되지 않은 일정 날짜
  const notDoneDates = schedules
    ? schedules
        .filter((s) => s.status !== 'done')
        .map((s) => new Date(s.date).toDateString())
    : [];

  // 달력에서 선택한 날짜의 스케줄 정보
  const [selectedSchedule, setSelectedSchedule] =
    useState<GetScheduleProps | null>(null);

  // 달력 토글 상태
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!schedules || schedules.length === 0) return;
    const today = new Date();
    const localMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    // const utcMidnightStr = localMidnight.toISOString();
    // 오늘 또는 이후의 일정 중 가장 가까운 것 찾기
    const nextSchedule = schedules
      .map((s) => ({ ...s, dateObj: new Date(s.date) }))
      .filter((s) => s.status === 'attendees' || s.status === 'pending')
      // .filter((s) => s.status === 'attendees' || s.status === 'pending')
      .filter((s) => s.dateObj >= localMidnight)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];

    // 오늘 이후 일정이 없으면 가장 마지막 일정 선택(옵션)
    setSelectedSchedule(
      nextSchedule || schedules[schedules.length - 1] || null
    );
  }, [schedules]);

  if (gamesLoading || playingGameLoading) {
    return <Skeleton lines={3} cardHeight={120} />;
  }

  return (
    <Container>
      {/* 인라인 데이트픽커 상단에 추가 */}

      <div className="flex flex-col gap-4">
        {/* 현재 게임중 섹션 */}
        <CurrentPlayingGame
          data={playingGameResult}
          isLoading={playingGameLoading}
          mutate={mutatePlayingGame}
        />

        {/* 선택된 날짜의 스케줄이 있으면 해당 스케줄만, 없으면 기존처럼 전체/다음 일정 */}
        <LatestPendingSchedule selectedSchedule={selectedSchedule} />
        <div className="flex flex-col items-center print-hidden">
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild className="w-full">
              <button
                className="cursor-pointer select-none mb-2 p-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center justify-center shadow-lg"
                title="다른일정보기"
              >
                <span className="px-2 font-bold"> 다른일정보기</span>
                <CalendarIcon
                  size={24}
                  className="w-[24px] h-[24px] text-gray-700"
                />
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  // 같은 날짜를 다시 클릭해도 선택 해제되지 않도록 처리
                  if (date) {
                    setSelectedDate(date);
                    // 선택한 날짜가 현재 주 범위 밖이면 주를 이동
                    if (date < currentWeekStart || date > currentWeekEnd) {
                      setCurrentWeekStart(
                        startOfWeek(date, { weekStartsOn: 0 })
                      );
                    }
                    // 해당 날짜의 스케줄 정보 저장
                    const schedule = schedules?.find(
                      (s) =>
                        new Date(s.date).toDateString() === date.toDateString()
                    );
                    setSelectedSchedule(schedule || null);
                  }
                  // date가 undefined인 경우 (같은 날짜 재클릭) 아무것도 하지 않음
                }}
                modifiers={{
                  doneSchedule: (date) =>
                    doneDates.includes(date.toDateString()),
                  hasSchedule: (date) =>
                    notDoneDates.includes(date.toDateString()),
                  sunday: (date) => date.getDay() === 0,
                  saturday: (date) => date.getDay() === 6,
                }}
                modifiersClassNames={{
                  doneSchedule:
                    'relative after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-2 after:text-red-500 after:content-["●"] after:text-[10px] after:h-[10px] after:w-[10px]',
                  hasSchedule:
                    'relative after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-2 after:text-blue-500 after:content-["●"] after:text-[10px] after:h-[10px] after:w-[10px]',
                  sunday: 'text-red-500',
                  saturday: 'text-blue-500',
                }}
                className="rounded-md border shadow"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 진행예정게임대진 섹션 */}
        <LatestMatchSchedule />

        {/* 최근 게임 결과 섹션 */}
        <LatestGameResult />

        {/* 최근 게임 순위 섹션 */}
        <LatestGameRanking />

        {/* 통계 테이블 섹션 */}
        <StatsTable />
      </div>
    </Container>
  );
}
