'use client';

import { GetScheduleProps } from '@/model/schedule';
import { format, differenceInCalendarDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Props = {
  selectedSchedule?: GetScheduleProps | null;
};

// 홈 히어로 — 다음 경기 전광판
export default function LatestPendingSchedule({ selectedSchedule }: Props) {
  const router = useRouter();
  const schedule = selectedSchedule;
  const { data: session } = useSession();
  if (!schedule) return null;

  const uniquePlayers = new Set(
    schedule.attendees?.map((attendee) => attendee.name) || []
  );
  const courts = Array.isArray(schedule.courtNumbers)
    ? schedule.courtNumbers
        .map((cn) => (typeof cn === 'object' && cn.number ? cn.number : cn))
        .join('·')
    : '';

  const date = new Date(schedule.date);
  const dday = differenceInCalendarDays(date, new Date());
  const isDone = schedule.status === 'done';
  const ddayLabel = isDone
    ? '경기 종료'
    : dday === 0
      ? 'TODAY · 참석 투표 중'
      : dday > 0
        ? `D-${dday} · 참석 투표 중`
        : '지난 일정';

  return (
    <section className="print-hidden relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#23503c] to-[#142e22] p-5 text-[#f0f3e4] shadow-lg">
      {/* 코트 라인 장식 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-11 -top-11 h-36 w-36 rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-2 h-36 w-36 rounded-full border border-white/[0.06]"
      />

      <span
        className={
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-wide ' +
          (isDone
            ? 'border-white/20 text-white/70'
            : 'border-[#e59a70]/40 bg-[#d97a4e]/15 text-[#e59a70]')
        }
      >
        {!isDone && (
          <i className="h-1.5 w-1.5 rounded-full bg-[#e59a70]" aria-hidden />
        )}
        {ddayLabel}
      </span>

      <p className="mb-1 mt-3 text-[11px] font-extrabold tracking-[0.15em] text-ball">
        NEXT MATCH
      </p>
      <h3 className="text-[26px] font-black leading-tight tracking-tight">
        {format(date, 'M월 d일 EEE', { locale: ko })}{' '}
        <span className="text-ball">
          {schedule.startTime}–{schedule.endTime}
        </span>
      </h3>
      <p className="mb-4 mt-1 text-[13px] text-white/60">
        {schedule.courtName}
        {courts && <> · {courts}코트</>} · 현재 참석 {uniquePlayers.size}명
      </p>

      <div className="flex gap-2.5">
        {isDone ? (
          <button
            type="button"
            onClick={() => router.push(`/games/${schedule.id}`)}
            className="flex-1 rounded-xl bg-ball py-3 text-[15px] font-black text-[#141b10] shadow-[0_6px_18px_rgba(214,225,78,0.25)]"
          >
            게임 결과 보기
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.push(`/schedule/${schedule.id}`)}
              className="flex-1 rounded-xl bg-ball py-3 text-[15px] font-black text-[#141b10] shadow-[0_6px_18px_rgba(214,225,78,0.25)]"
            >
              참석 투표하기
            </button>
            {session && session.user && session.user.level >= 3 && (
              <button
                type="button"
                onClick={() => router.push(`/match/${schedule.id}`)}
                className="rounded-xl border border-white/25 px-4 text-[13px] font-semibold text-white/85"
              >
                대진표
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
