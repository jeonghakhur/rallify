'use client';

import MatchPrintPageContent from '@/components/MatchPrintPageContent';
import { getSchedule } from '@/service/schedule';

// import useGame from '@/hooks/useGames';
import Skeleton from './common/Skeleton';
import useSWR from 'swr';
import { GameResult } from '@/model/gameResult';

export default function LatestMatchSchedule() {
  const {
    data: gameResult,
    isLoading: gameLoading,
    error: gameError,
  } = useSWR<GameResult>('/api/games/latest?status=shared');

  // const {
  //   game: gameResult,
  //   isLoading: gameLoading,
  //   error: gameError,
  // } = useGame('89xezVoxyX62cPX9RogpU8');

  // schedule 정보 fetch (attendees, courtNumbers 등)
  const { data: schedule, isLoading: scheduleLoading } = useSWR(
    gameResult?.scheduleID ? `/api/schedule/${gameResult.scheduleID}` : null,
    () => (gameResult ? getSchedule(gameResult.scheduleID) : undefined),
    { revalidateOnFocus: false }
  );

  const isLoading = gameLoading || scheduleLoading;

  if (isLoading) {
    return <Skeleton lines={4} />;
  }

  if (gameError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          진행예정게임대진
        </h3>
        <div className="text-center py-8 text-red-500">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  if (!gameResult) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 print-hidden">
        진행예정게임대진
      </h3>
      <MatchPrintPageContent
        matchData={{
          games: gameResult.games,
          courtNumbers: schedule.courtNumbers,
          attendees: schedule.attendees,
          courtName: gameResult.courtName,
          date: typeof gameResult.date === 'string' ? gameResult.date : '',
        }}
        className="px-0 pb-0"
      />
    </div>
  );
}
