'use client';

import { GameResult } from '@/model/gameResult';
import useSWR, { mutate } from 'swr';
import { useMemo, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { UserProps } from '@/model/user';
import { Calendar } from './ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import useAuthRedirect from '@/hooks/useAuthRedirect';
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

function StatsTableContent({ stats }: { stats: PlayerStats[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayStats = showAll ? stats : stats.slice(0, 10);
  const router = useRouter();

  const handleNameClick = (name: string) => {
    router.push(`/player/${encodeURIComponent(name)}`);
  };

  const podium = stats.slice(0, 3);

  return (
    <div className="space-y-4">
      {podium.length === 3 && (
        <div className="grid grid-cols-3 items-end gap-2.5">
          {[podium[1], podium[0], podium[2]].map((p, i) => {
            if (!p) return null;
            const isFirst = i === 1;
            const rankLabel = isFirst ? '1ST' : i === 0 ? '2ND' : '3RD';
            return (
              <button
                type="button"
                key={p.name}
                onClick={() => handleNameClick(p.name)}
                className={
                  'rounded-2xl border bg-card px-2 pb-3 text-center ' +
                  (isFirst
                    ? 'border-primary/50 pt-5 shadow-[0_8px_26px_hsl(var(--ball)/0.15)] dark:border-ball/50'
                    : 'border-border pt-3.5')
                }
              >
                <p
                  className={
                    'text-[10px] font-black tracking-[0.18em] ' +
                    (isFirst
                      ? 'text-primary dark:text-ball'
                      : 'text-muted-foreground')
                  }
                >
                  {rankLabel}
                </p>
                <p className="mt-0.5 truncate text-sm font-extrabold text-foreground">
                  {p.name}
                </p>
                <p
                  className={
                    'font-black tabular-nums leading-tight ' +
                    (isFirst
                      ? 'text-[32px] text-primary dark:text-ball'
                      : 'text-[24px] text-muted-foreground')
                  }
                >
                  {p.point}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {p.win}승 {p.game}게임 · {(p.winRate * 100).toFixed(1)}%
                </p>
              </button>
            );
          })}
        </div>
      )}
      <RankList rows={displayStats} onNameClick={handleNameClick} />

      {stats.length > 10 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="px-6"
          >
            {showAll ? '접기' : `더보기 (${stats.length - 10}명 더)`}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function StatsTable() {
  // 가입된 회원 목록 불러오기
  const { data: members } = useSWR<UserProps[]>('/api/members');
  const { user } = useAuthRedirect('/');
  const isAdmin = user && user.level > 3;

  // 시작일/종료일 상태 관리
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  // 현재 조회기간을 최초 1회 불러와 초기값 세팅
  useEffect(() => {
    fetch('/api/stats-period')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.startDate && data.endDate) {
          setStartDate(new Date(data.startDate));
          setEndDate(new Date(data.endDate));
        } else {
          // 기본값: 6개월 전 ~ 오늘
          const today = new Date();
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(today.getMonth() - 6);
          setStartDate(sixMonthsAgo);
          setEndDate(today);
        }
      });
  }, []);

  // 날짜 필터가 적용된 API URL 생성
  const gamesApiUrl = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);
    return `/api/games?status=done&startDate=${start}&endDate=${end}`;
  }, [startDate, endDate]);

  const { data: games, error } = useSWR<GameResult[]>(gamesApiUrl);

  // 적용 버튼 클릭 시 동작(서버 저장/조회 등 연동 필요)
  const handleApply = async () => {
    if (!startDate || !endDate) return;
    try {
      const res = await fetch('/api/stats-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        alert('저장 실패: ' + (error.error || res.statusText));
        return;
      }
      alert('조회기간이 저장되었습니다!');
      // 데이터 갱신
      if (gamesApiUrl) {
        mutate(gamesApiUrl);
      }
    } catch {
      alert('조회기간 저장 중 오류 발생');
    }
  };

  // 가입된 회원 이름 목록
  const memberNames = useMemo(
    () => (members ? members.map((m) => m.name) : []),
    [members]
  );

  // stats에서 가입된 회원만 필터링
  const stats = useMemo(() => {
    if (!games) return [];
    const allStats = calculateStats(games);
    if (!memberNames.length) return allStats;
    return allStats.filter((s) => memberNames.includes(s.name));
  }, [games, memberNames]);

  // 날짜가 아직 로드되지 않았거나 데이터 로딩 중일 때
  // if (!gamesApiUrl || isLoading) {
  //   return (
  //     <div>
  //       <h2 className="text-xl font-semibold text-foreground mb-4">전체순위</h2>
  //       <LoadingGrid loading={true} />
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">전체순위</h2>
        <div className="text-center py-20 text-lg text-red-500 overflow-x-auto">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">전체순위</h2>
        <div className="text-center py-20 text-lg text-muted-foreground">
          조회된 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="print-hidden">
      <h2 className="text-xl font-semibold text-foreground mb-4">전체순위</h2>
      {isAdmin && (
        <div className="flex gap-2 mb-4">
          <Popover open={openStart} onOpenChange={setOpenStart}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {startDate ? startDate.toLocaleDateString() : '시작일 선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date ?? undefined);
                  setOpenStart(false);
                }}

                // 오늘 이전 비활성화 등 옵션 추가 가능
              />
            </PopoverContent>
          </Popover>
          <Popover open={openEnd} onOpenChange={setOpenEnd}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {endDate ? endDate.toLocaleDateString() : '종료일 선택'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date ?? undefined);
                  setOpenEnd(false);
                }}
                disabled={(date) => !startDate || date < startDate}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleApply} disabled={!startDate || !endDate}>
            적용
          </Button>
        </div>
      )}
      <StatsTableContent stats={stats} />
    </div>
  );
}
