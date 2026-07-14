'use client';

import { Container } from '@/components/Layout';
import LoadingGrid from '@/components/LoadingGrid';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { GetScheduleProps } from '@/model/schedule';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { CalendarPlus, SlidersHorizontal } from 'lucide-react';

export default function ScheduleList() {
  const { user } = useAuthRedirect('/');
  const { data: schedules, error } = useSWR<GetScheduleProps[]>(
    '/api/schedule',
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  // 조회기간 상태
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  // 팝오버 열림 상태 관리
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  // 조회기간 UI 노출 상태
  const [showPeriod, setShowPeriod] = useState(false);
  // 인피니티 스크롤 상태
  const [visibleCount, setVisibleCount] = useState(10);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (schedules || error) {
      setLoading(false);
    }
  }, [schedules, error]);

  useEffect(() => {
    console.log(openStart);
  }, [openStart]);

  const filteredSchedules = useMemo(() => {
    return (
      schedules?.filter((schedule) => {
        const date = new Date(schedule.date);
        return (
          (!startDate || date >= startDate) && (!endDate || date <= endDate)
        );
      }) || []
    );
  }, [schedules, startDate, endDate]);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      // 브라우저 전체 스크롤이 하단에 닿았을 때
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setVisibleCount((prev) => {
          if (filteredSchedules && prev < filteredSchedules.length) {
            return Math.min(prev + 5, filteredSchedules.length);
          }
          return prev;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredSchedules]);

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

  // 조회기간에 맞는 일정만 필터링

  if (loading) {
    return (
      <Container>
        <LoadingGrid loading={loading} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-muted rounded-lg p-8 w-full max-w-md">
              <div className="text-muted-foreground mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                데이터를 불러오는데 실패했습니다
              </h3>
              <p className="text-muted-foreground mb-6">
                잠시 후 다시 시도해주세요.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full max-w-xs"
              >
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <Container>
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-muted rounded-lg p-8 w-full max-w-md">
              <div className="text-muted-foreground mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                등록된 스케줄이 없습니다
              </h3>
              <p className="text-muted-foreground mb-6">
                아직 등록된 스케줄이 없습니다.
              </p>
              {user && user.level >= 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/schedule/new')}
                  className="w-full max-w-xs"
                >
                  새 스케줄 등록하기
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">게임일정</h1>
        {user && user.level >= 3 && (
          <CalendarPlus
            className="ml-auto"
            onClick={() => router.push('/schedule/new')}
          />
        )}
        <SlidersHorizontal
          className="ml-3 cursor-pointer"
          onClick={() => setShowPeriod((prev) => !prev)}
        />
      </div>

      {/* 조회기간 선택 UI (토글) */}
      {showPeriod && (
        <div className="flex gap-2 items-center my-4">
          <Popover open={openStart} onOpenChange={setOpenStart}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left"
              >
                {startDate ? format(startDate, 'yyyy-MM-dd') : '시작일 선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date ?? undefined);
                  setOpenStart(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <span>~</span>
          <Popover open={openEnd} onOpenChange={setOpenEnd}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left"
              >
                {endDate ? format(endDate, 'yyyy-MM-dd') : '종료일 선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Calendar
                mode="single"
                selected={endDate}
                disabled={startDate ? { before: startDate } : undefined}
                onSelect={(date) => {
                  setEndDate(date ?? undefined);
                  setOpenEnd(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="grid gap-4" ref={listRef}>
        {filteredSchedules?.slice(0, visibleCount).map((schedule) => {
          const workoutInfo = getWorkoutInfo(schedule);

          const statusMap: Record<string, string> = {
            pending: '대기중',
            attendees: '참석자등록',
            matchmaking: '대진표작성',
            shared: '대진표공유',
            playing: '게임진행',
            done: '게임완료',
          };
          const status = statusMap[schedule.status] || '';

          const scheduleDate = new Date(schedule.date);
          const isPast = schedule.status === 'done';
          const isToday =
            scheduleDate.toDateString() === new Date().toDateString();
          const courts = Array.isArray(schedule.courtNumbers)
            ? schedule.courtNumbers
                .map((cn) =>
                  typeof cn === 'object' && cn.number ? cn.number : cn
                )
                .join('·')
            : '';
          const needsVote = schedule.status === 'attendees';

          return (
            <div
              key={schedule.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="grid grid-cols-[72px_1fr] items-center gap-4">
                <div
                  className={
                    'border-r border-border pr-4 text-center tabular-nums ' +
                    (isPast ? 'opacity-45' : '')
                  }
                >
                  <p className="text-[10px] font-extrabold tracking-[0.14em] text-muted-foreground">
                    {format(scheduleDate, 'M월', { locale: ko })}
                  </p>
                  <p
                    className={
                      'text-[30px] font-black leading-tight ' +
                      (isToday ? 'text-clay' : 'text-foreground')
                    }
                  >
                    {format(scheduleDate, 'd')}
                  </p>
                  <p
                    className={
                      'text-[11px] font-extrabold ' +
                      (isToday
                        ? 'text-clay'
                        : isPast
                          ? 'text-muted-foreground'
                          : 'text-primary dark:text-accent')
                    }
                  >
                    {format(scheduleDate, 'EEEE', { locale: ko })}
                  </p>
                </div>
                <div>
                  <p className="flex items-center text-[15px] font-extrabold text-foreground">
                    {workoutInfo?.startTime}–{workoutInfo?.endTime}시
                    <span
                      className={
                        'ml-2 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide ' +
                        (needsVote
                          ? 'border-clay/40 bg-clay/10 text-clay'
                          : isPast
                            ? 'border-primary/30 bg-primary/10 text-primary dark:text-accent dark:border-accent/30 dark:bg-accent/10'
                            : 'border-border bg-muted text-muted-foreground')
                      }
                    >
                      {isPast
                        ? `완료 · ${workoutInfo?.totalPlayers ?? 0}명`
                        : status}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {schedule.courtName}
                    {courts && <> · {courts}코트</>}
                  </p>
                  {!isPast && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      참석{' '}
                      <b className="text-foreground">
                        {workoutInfo?.totalPlayers ?? 0}명
                      </b>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid mt-3">
                {user && user.level >= 3 && (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        router.push(`/schedule/${schedule.id}`);
                      }}
                    >
                      참석자등록
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      variant="default"
                      onClick={() => {
                        router.push(`/match/${schedule.id}`);
                      }}
                    >
                      대진표({status})
                    </Button>
                    {schedule.status === 'done' && (
                      <Button
                        type="button"
                        className="flex-1"
                        variant="default"
                        onClick={() => router.push(`/games/${schedule.id}`)}
                      >
                        게임결과
                      </Button>
                    )}
                  </div>
                )}

                {user && user.level < 3 && (
                  <>
                    {schedule.status === 'attendees' && (
                      <Button
                        type="button"
                        variant="default"
                        size="lg"
                        onClick={() => router.push(`/schedule/${schedule.id}`)}
                      >
                        참석투표
                      </Button>
                    )}
                    {schedule.status === 'done' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => router.push(`/games/${schedule.id}`)}
                      >
                        게임결과
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
