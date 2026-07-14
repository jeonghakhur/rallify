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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface Game {
  id: string;
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
  scheduleStatus?: string;
}

export default function Home() {
  const { isLoading } = useAuthRedirect('/');
  const { data: games } = useSWR<Game[]>('/api/games?status=done,playing', {
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
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

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
        <h1 className="text-2xl font-bold text-foreground">게임결과</h1>
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                등록된 게임이 없습니다
              </h3>
              <p className="text-muted-foreground mb-6">
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
          const isExpanded = expandedGames.has(game.id);
          const displayedGames = isExpanded
            ? game.games
            : game.games.slice(0, 2);
          const hasMoreGames = game.games.length > 2;

          return (
            <div
              key={game.id}
              className={`bg-card rounded-lg shadow-md py-6 px-4 transition-shadow border border-border ${
                isClickable
                  ? 'cursor-pointer hover:shadow-lg'
                  : 'cursor-default'
              }`}
              onClick={isClickable ? () => setSelectedGame(game) : undefined}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                    {format(new Date(date), 'M월 d일 (EEE)', { locale: ko })}
                    {game.scheduleStatus === 'playing' && (
                      <span className="flex items-center gap-1 rounded-full border border-clay/40 bg-clay/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-clay">
                        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
                        LIVE
                      </span>
                    )}
                  </h2>
                  <p className="text-[13px] text-muted-foreground">
                    {game.courtName} · {game.games.length}게임
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {displayedGames.map((g, index) => {
                  const scoreA = parseInt(g.score[0] || '0') || 0;
                  const scoreB = parseInt(g.score[1] || '0') || 0;
                  const teamAWins = scoreA > scoreB;
                  const teamBWins = scoreB > scoreA;

                  const pairRow = (
                    players: string,
                    score: string,
                    wins: boolean,
                    loses: boolean
                  ) => (
                    <div className="flex items-center justify-between gap-2 py-0.5">
                      <span
                        className={
                          'text-sm ' +
                          (wins
                            ? 'font-extrabold text-foreground'
                            : loses
                              ? 'font-medium text-muted-foreground/70'
                              : 'font-medium text-foreground')
                        }
                      >
                        {players}
                        {wins && (
                          <span className="ml-1.5 rounded bg-primary px-1 py-px align-[2px] text-[8px] font-black tracking-wider text-primary-foreground dark:bg-ball dark:text-[#141b10]">
                            WIN
                          </span>
                        )}
                      </span>
                      <span
                        className={
                          'text-xl font-black tabular-nums leading-none ' +
                          (wins
                            ? 'text-primary dark:text-ball'
                            : loses
                              ? 'text-muted-foreground/50'
                              : 'text-foreground')
                        }
                      >
                        {score || '0'}
                      </span>
                    </div>
                  );

                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-muted/60 px-3.5 py-3"
                    >
                      <div className="mb-1.5 flex justify-between text-[10px] font-bold tracking-wide text-muted-foreground">
                        <span>
                          GAME {index + 1}
                          {g.court && ` · ${g.court}코트`}
                        </span>
                        <span>{g.time}</span>
                      </div>
                      {pairRow(
                        `${g.players[0]} · ${g.players[1]}`,
                        g.score[0] ?? '0',
                        teamAWins,
                        teamBWins
                      )}
                      <div className="my-1 border-t border-dashed border-border" />
                      {pairRow(
                        `${g.players[2]} · ${g.players[3]}`,
                        g.score[1] ?? '0',
                        teamBWins,
                        teamAWins
                      )}
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
                      toggleGameExpansion(game.id);
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

      {/* 게임 상세 결과 모달 */}
      <Dialog
        open={!!selectedGame}
        onOpenChange={(open) => {
          if (!open) setSelectedGame(null);
        }}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedGame && (
            <>
              <DialogTitle className="text-center">
                <div className="text-xl font-bold">
                  {selectedGame.courtName}
                </div>
                <div className="text-sm text-muted-foreground font-normal mt-1">
                  {format(
                    new Date(selectedGame.date),
                    'yyyy년 MM월 dd일 (EEE)',
                    { locale: ko }
                  )}
                </div>
              </DialogTitle>

              <div className="text-sm text-muted-foreground text-center">
                총 {selectedGame.games.length}개의 게임
              </div>

              <div className="flex flex-col gap-3 mt-2">
                {selectedGame.games.map((g, index) => {
                  const scoreA = parseInt(g.score[0] || '0') || 0;
                  const scoreB = parseInt(g.score[1] || '0') || 0;
                  const teamAWins = scoreA > scoreB;
                  const teamBWins = scoreB > scoreA;

                  return (
                    <div key={index} className="bg-muted rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          게임 {index + 1}
                        </span>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>{g.time}</span>
                          {g.court && <span>{g.court}코트</span>}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <div className={`${teamAWins ? 'font-bold' : ''}`}>
                          {g.players[0]}/{g.players[1]}
                          <span
                            className={`ml-1 ${teamAWins ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}
                          >
                            [{g.score[0] || '0'}]
                          </span>
                        </div>
                        <div className="text-muted-foreground mx-2">vs</div>
                        <div className={`${teamBWins ? 'font-bold' : ''}`}>
                          {g.players[2]}/{g.players[3]}
                          <span
                            className={`ml-1 ${teamBWins ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}
                          >
                            [{g.score[1] || '0'}]
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  router.push(`/games/${selectedGame.scheduleID}`);
                  setSelectedGame(null);
                }}
              >
                상세 페이지로 이동
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
