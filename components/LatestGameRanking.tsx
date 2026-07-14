'use client';

import { GameResult } from '@/model/gameResult';
import LoadingGrid from '@/components/LoadingGrid';
import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import Image from 'next/image';
import { UserProps } from '@/model/user';
import { Check } from 'lucide-react';
import { ko } from 'date-fns/locale';
import RankList from './RankList';

type PlayerStats = {
  name: string;
  win: number;
  draw: number;
  lose: number;
  game: number;
  point: number;
  winRate: number;
  score: number;
  loseScore: number;
  margin: number;
};

function calculateStats(games: GameResult[]): PlayerStats[] {
  const stats: Record<string, PlayerStats> = {};

  games.forEach((gameResult) => {
    gameResult.games.forEach((game) => {
      // 2:2 경기 기준
      const [scoreA = 0, scoreB = 0] = game.score.map(Number);
      const teamA = [game.players[0], game.players[1]].filter(
        (p): p is string => !!p
      );
      const teamB = [game.players[2], game.players[3]].filter(
        (p): p is string => !!p
      );

      teamA.forEach((name: string) => {
        if (!stats[name]) {
          stats[name] = {
            name,
            win: 0,
            draw: 0,
            lose: 0,
            game: 0,
            point: 0,
            winRate: 0,
            score: 0,
            loseScore: 0,
            margin: 0,
          };
        }
        stats[name].game += 1;
        stats[name].score += scoreA;
        stats[name].loseScore += scoreB;
        stats[name].margin += scoreA - scoreB;
        if (scoreA > scoreB) {
          stats[name].win += 1;
          stats[name].point += 3;
        } else if (scoreA === scoreB) {
          stats[name].draw += 1;
          stats[name].point += 1;
        } else {
          stats[name].lose += 1;
        }
      });

      teamB.forEach((name: string) => {
        if (!stats[name]) {
          stats[name] = {
            name,
            win: 0,
            draw: 0,
            lose: 0,
            game: 0,
            point: 0,
            winRate: 0,
            score: 0,
            loseScore: 0,
            margin: 0,
          };
        }
        stats[name].game += 1;
        stats[name].score += scoreB;
        stats[name].loseScore += scoreA;
        stats[name].margin += scoreB - scoreA;
        if (scoreB > scoreA) {
          stats[name].win += 1;
          stats[name].point += 3;
        } else if (scoreB === scoreA) {
          stats[name].draw += 1;
          stats[name].point += 1;
        } else {
          stats[name].lose += 1;
        }
      });
    });
  });

  // 승률 계산
  Object.values(stats).forEach((s) => {
    const denominator = s.win + s.lose;
    s.winRate = denominator > 0 ? s.win / denominator : 0;
  });

  // 정렬: 승점 → 승률 → 마진
  return Object.values(stats).sort(
    (a, b) => b.point - a.point || b.winRate - a.winRate || b.margin - a.margin
  );
}

export default function LatestGameRanking() {
  const [showAll, setShowAll] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    data: games,
    isLoading,
    error,
  } = useSWR<GameResult[]>('/api/games?status=done');
  const { data: members } = useSWR<UserProps[]>('/api/members');

  // 마지막 스케줄의 game_done 게임만 필터링
  const latestGame = useMemo(() => {
    if (!games || games.length === 0) return null;
    return games
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .find((game) => game.games && game.games.length > 0);
  }, [games]);

  const stats = useMemo(() => {
    if (!latestGame) return [];
    return calculateStats([latestGame]);
  }, [latestGame]);

  const displayStats = showAll ? stats : stats.slice(0, 3);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          최근게임순위
        </h2>
        <LoadingGrid loading={isLoading} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          최근게임순위
        </h2>
        <div className="text-center py-20 text-lg text-red-500 overflow-x-auto">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          최근게임순위
        </h2>
        <div className="text-center py-20 text-lg text-muted-foreground">
          최근 완료된 게임 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="print-hidden">
      <h2 className="mb-4 flex items-center justify-between ">
        <div className="text-xl text-foreground font-semibold">
          최근게임순위
        </div>
        {latestGame && (
          <div className="text-sm text-muted-foreground text-right">
            {format(new Date(latestGame.date), 'yy년MM월dd일(EEE)', {
              locale: ko,
            })}
            <br />
            {latestGame.courtName}
          </div>
        )}
      </h2>
      <RankList
        rows={displayStats}
        onNameClick={(name) => {
          setSelectedPlayer(name);
          setDialogOpen(true);
        }}
      />
      {/* 선택된 플레이어의 최근 게임 결과 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-[95%] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedPlayer}의 최근 게임 결과</DialogTitle>
          </DialogHeader>
          {selectedPlayer && latestGame && (
            <div className="space-y-4">
              {latestGame.games
                .filter((g) => g.players.includes(selectedPlayer))
                .map((g, i) => {
                  // 팀 정보
                  const teamA = g.players.slice(0, 2);
                  const teamB = g.players.slice(2, 4);
                  // 회원 정보
                  const getMember = (name: string) =>
                    members?.find((m) => m.name === name);
                  // 승리팀 판별
                  const scoreA = Number(g.score?.[0] ?? 0);
                  const scoreB = Number(g.score?.[1] ?? 0);
                  const isTeamAWin = scoreA > scoreB;
                  const isTeamBWin = scoreB > scoreA;
                  // 본인 팀 강조
                  // 체크 아이콘
                  const CheckIcon = () => (
                    <Check
                      className="inline-block align-middle ml-1 "
                      size={20}
                    />
                  );
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border p-3 shadow-sm bg-card flex flex-col gap-2`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs text-muted-foreground font-semibold">
                          {g.court}코트
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {g.time && `${g.time} 게임`}
                        </div>
                      </div>
                      {/* 팀A */}
                      <div
                        className={`flex items-center gap-2 ${isTeamAWin ? 'font-bold' : ''}`}
                      >
                        {teamA.map((name, idx) => {
                          const member = getMember(name);
                          return (
                            <span
                              key={name}
                              className="flex items-center gap-1"
                            >
                              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-card ring-2 ring-border shadow-sm bg-card flex-shrink-0">
                                <Image
                                  src={
                                    member?.image ||
                                    '/icons/android-192x192.png'
                                  }
                                  alt={name + ' 프로필'}
                                  width={28}
                                  height={28}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <span className="text-sm">{name}</span>
                              {isTeamAWin && idx === teamA.length - 1 && (
                                <CheckIcon />
                              )}
                            </span>
                          );
                        })}
                        <span className="ml-auto flex gap-1 font-mono text-base">
                          <span
                            className={
                              isTeamAWin ? 'text-sky-500 font-bold' : ''
                            }
                          >
                            {scoreA}
                          </span>
                        </span>
                      </div>
                      {/* 팀B */}
                      <div
                        className={`flex items-center gap-2 ${isTeamBWin ? 'font-bold' : ''}`}
                      >
                        {teamB.map((name, idx) => {
                          const member = getMember(name);
                          return (
                            <span
                              key={name}
                              className="flex items-center gap-1"
                            >
                              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-card ring-2 ring-border shadow-sm bg-card flex-shrink-0">
                                <Image
                                  src={
                                    member?.image ||
                                    '/icons/android-192x192.png'
                                  }
                                  alt={name + ' 프로필'}
                                  width={28}
                                  height={28}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <span className="text-sm">{name}</span>
                              {isTeamBWin && idx === teamB.length - 1 && (
                                <CheckIcon />
                              )}
                            </span>
                          );
                        })}
                        <span className="ml-auto flex gap-1 font-mono text-base">
                          <span
                            className={
                              isTeamBWin ? 'text-sky-500 font-bold' : ''
                            }
                          >
                            {scoreB}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {stats.length > 3 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="px-6"
          >
            {showAll ? '접기' : `더보기 (${stats.length - 3}명 더)`}
          </Button>
        </div>
      )}
    </div>
  );
}
