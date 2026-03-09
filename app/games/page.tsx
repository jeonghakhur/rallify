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
import { GameComment } from '@/model/gameResult';
import { SlidersHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface Game {
  _id: string;
  scheduleID: string;
  courtName: string;
  date: string;
  games: {
    time: string;
    court: string;
    players: string[];
    score: string[];
  }[];
  comments?: GameComment[];
}

export default function Home() {
  const { isLoading } = useAuthRedirect('/', 0);
  const { data: games } = useSWR<Game[]>('/api/games?status=done', {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });
  const [loading, setLoading] = useState<boolean>(isLoading);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const router = useRouter();
  const [showPeriod, setShowPeriod] = useState(false);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(5);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (games) {
      console.log(games);
      setLoading(false);
    }
  }, [games]);

  const toggleGameExpansion = (gameId: string) => {
    const newExpanded = new Set(expandedGames);
    if (newExpanded.has(gameId)) {
      newExpanded.delete(gameId);
    } else {
      newExpanded.add(gameId);
    }
    setExpandedGames(newExpanded);
  };

  const filteredGames = useMemo(() => {
    return (
      games?.filter((game) => {
        const date = new Date(game.date);
        return (
          (!startDate || date >= startDate) && (!endDate || date <= endDate)
        );
      }) || []
    );
  }, [games, startDate, endDate]);

  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setVisibleCount((prev) => {
          if (filteredGames && prev < filteredGames.length) {
            return Math.min(prev + 5, filteredGames.length);
          }
          return prev;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredGames]);

  if (loading) {
    return (
      <Container>
        <LoadingGrid loading={loading} />
      </Container>
    );
  }

  // 항상 상단에 SlidersHorizontal 및 조회기간 UI 노출
  const periodUI = (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">게임결과</h1>
        <SlidersHorizontal
          className="ml-3 cursor-pointer"
          onClick={() => setShowPeriod((prev) => !prev)}
        />
      </div>
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
                onSelect={(date) => {
                  setEndDate(date ?? undefined);
                  setOpenEnd(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </>
  );

  if (filteredGames.length === 0) {
    return (
      <Container>
        {periodUI}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-gray-50 rounded-lg p-8 w-full max-w-md">
              <div className="text-gray-500 mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 게임이 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                조회기간에 해당하는 게임 데이터가 없습니다.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/schedule')}
                className="w-full max-w-xs"
              >
                새 게임 등록하기
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {periodUI}
      <div className="flex flex-col gap-4" ref={listRef}>
        {filteredGames.slice(0, visibleCount).map((game) => {
          const date = new Date(game.date);
          const isClickable = true; // 모든 사용자가 클릭 가능
          const isExpanded = expandedGames.has(game._id);
          const displayedGames = isExpanded
            ? game.games
            : game.games.slice(0, 2);
          const hasMoreGames = game.games.length > 2;

          return (
            <div
              key={game._id}
              className={`bg-white rounded-lg shadow-md py-6 px-4 transition-shadow border border-gray-200 ${
                isClickable
                  ? 'cursor-pointer hover:shadow-lg'
                  : 'cursor-default'
              }`}
              onClick={
                isClickable
                  ? () => router.push(`/games/${game.scheduleID}`)
                  : undefined
              }
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {game.courtName}
                  </h2>
                  <p className="text-gray-600">
                    {format(new Date(date), 'yyyy년 MM월 dd일 (EEE)', {
                      locale: ko,
                    })}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {game.games.length}개의 게임
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedGames.map((g, index) => {
                  const scoreA = parseInt(g.score[0] || '0') || 0;
                  const scoreB = parseInt(g.score[1] || '0') || 0;
                  const teamAWins = scoreA > scoreB;
                  const teamBWins = scoreB > scoreA;

                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          게임 {index + 1}
                        </span>
                        <span className="text-sm text-gray-500">{g.time}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            페어 A
                          </div>
                          <div
                            className={`text-sm ${teamAWins ? 'font-bold' : ''}`}
                          >
                            {g.players[0]}, {g.players[1]}
                            <span
                              className={`ml-1 ${teamAWins ? 'text-red-600 font-bold' : 'text-gray-700'}`}
                            >
                              [{g.score[0] || '0'}]
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            페어 B
                          </div>
                          <div
                            className={`text-sm ${teamBWins ? 'font-bold' : ''}`}
                          >
                            {g.players[2]}, {g.players[3]}
                            <span
                              className={`ml-1 ${teamBWins ? 'text-red-600 font-bold' : 'text-gray-700'}`}
                            >
                              [{g.score[1] || '0'}]
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMoreGames && (
                <div className="mt-4 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGameExpansion(game._id);
                    }}
                    className="text-sm"
                  >
                    {isExpanded
                      ? '접기'
                      : `+${game.games.length - 2}개의 게임 더보기`}
                  </Button>
                </div>
              )}

              {/* 게임 코멘트 섹션 */}
            </div>
          );
        })}
      </div>
    </Container>
  );
}
