'use client';

import { GameResult } from '@/model/gameResult';
import { Button } from '@/components/ui/button';
import { useMemo, useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface LatestGameResultProps {
  isLoading?: boolean;
}

export default function LatestGameResult({
  isLoading: externalLoading = false,
}: LatestGameResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);
  const savedScrollPosition = useRef<number>(0);
  const router = useRouter();

  // 최신 게임 데이터를 직접 가져오기
  const {
    data: gameResult,
    isLoading: gameLoading,
    error: gameError,
  } = useSWR<GameResult>('/api/games/latest?status=done');

  const isLoading = externalLoading || gameLoading;

  const formattedDate = useMemo(() => {
    if (!gameResult?.date) return '';
    return format(new Date(gameResult.date), 'yy년MM월dd일(EEE)', {
      locale: ko,
    });
  }, [gameResult?.date]);

  useEffect(() => {
    if (!shouldRestoreScroll) return;

    const timer = setTimeout(() => {
      window.scrollTo({
        top: savedScrollPosition.current,
        behavior: 'smooth',
      });
      setShouldRestoreScroll(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [shouldRestoreScroll, isExpanded]);

  const handleToggleExpansion = () => {
    console.log('handleToggleExpansion', isExpanded, window.scrollY);
    if (isExpanded) {
      // 접기 버튼 클릭 시 더보기를 누른 시점의 스크롤 위치로 복원
      setIsExpanded(false);
      setShouldRestoreScroll(true);
    } else {
      // 더보기 버튼 클릭 시 현재 스크롤 위치 저장
      savedScrollPosition.current = window.scrollY;
      setIsExpanded(true);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          최근 게임 결과
        </h3>
        <div className="text-center py-8 text-red-500">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  if (!gameResult) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          최근 게임 결과
        </h3>
        <div className="text-center py-8 text-gray-500">
          아직 완료된 게임이 없습니다.
        </div>
      </div>
    );
  }

  const totalGames = gameResult.games.length;
  const displayedGames = isExpanded
    ? gameResult.games
    : gameResult.games.slice(0, 2);
  const hasMoreGames = totalGames > 2;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 print-hidden">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">최근게임결과</h3>
        <div className="text-sm text-gray-600 text-right">
          {formattedDate}
          <br />
          {gameResult.courtName}
        </div>
      </div>

      {/* 각 게임별 상세 결과 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-semibold text-gray-700">
            게임별 결과 (총 {totalGames}게임)
          </div>
          {gameResult && (
            <button
              onClick={() => router.push(`/games/${gameResult.scheduleID}`)}
              className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 transition-colors underline underline-offset-4"
            >
              상세보기
              <svg
                className="w-3 h-3 opacity-60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
        {displayedGames.map((game, index) => {
          const scoreA = parseInt(game.score[0] || '0') || 0;
          const scoreB = parseInt(game.score[1] || '0') || 0;
          const teamAWins = scoreA > scoreB;
          const teamBWins = scoreB > scoreA;

          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  게임 {index + 1}
                </span>
                <span className="text-sm text-gray-500">{game.time}</span>
              </div>
              <div className="flex justify-between text-base">
                <div className={` ${teamAWins ? 'font-bold' : ''}`}>
                  {game.players[0]}/{game.players[1]}
                  <span
                    className={` ${teamAWins ? 'text-red-600 font-bold' : 'text-gray-700'}`}
                  >
                    [{game.score[0] || '0'}]
                  </span>
                </div>
                <div>vs</div>
                <div className={` ${teamBWins ? 'font-bold' : ''}`}>
                  {game.players[2]}/{game.players[3]}
                  <span
                    className={` ${teamBWins ? 'text-red-600 font-bold' : 'text-gray-700'}`}
                  >
                    [{game.score[1] || '0'}]
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 더보기 버튼 */}
      {hasMoreGames && (
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleExpansion}
            className="text-sm"
          >
            {isExpanded ? '접기' : `+${totalGames - 2}개의 게임 더보기`}
          </Button>
        </div>
      )}
    </div>
  );
}
