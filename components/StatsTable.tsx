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

  // 가장 많은 게임 수 찾기
  const maxGames = Math.max(...stats.map((s) => s.game));
  const minGamesThreshold = Math.ceil(maxGames * 0.33);

  // 33% 이상 참석한 회원들만 필터링
  const qualifiedPlayers = stats.filter((s) => s.game >= minGamesThreshold);

  // 각 항목별 상위 2명 찾기 (33% 이상 참석한 회원들 중에서)
  const sortedByPoint = [...qualifiedPlayers].sort((a, b) => b.point - a.point);
  const top2Points = sortedByPoint.slice(0, 2).map((s) => s.point);
  const top2PointPlayers = sortedByPoint.slice(0, 2).map((s) => s.name);

  // 승점 1,2위를 제외한 회원들 중에서 승률 1,2위 찾기
  const remainingForWinRate = qualifiedPlayers.filter(
    (p) => !top2PointPlayers.includes(p.name)
  );
  const sortedByWinRate = [...remainingForWinRate].sort(
    (a, b) => b.winRate - a.winRate || b.margin - a.margin
  );
  const top2WinRates = sortedByWinRate.slice(0, 2).map((s) => s.winRate);
  const top2WinRatePlayers = sortedByWinRate.slice(0, 2).map((s) => s.name);

  // 승점과 승률 1,2위를 제외한 회원들 중에서 마진 1,2위 찾기
  const remainingForMargin = qualifiedPlayers.filter(
    (p) =>
      !top2PointPlayers.includes(p.name) && !top2WinRatePlayers.includes(p.name)
  );
  const sortedByMargin = [...remainingForMargin].sort(
    (a, b) => b.margin - a.margin
  );
  const top2Margins = sortedByMargin.slice(0, 2).map((s) => s.margin);

  const getPointClass = (point: number) => {
    if (point === top2Points[0]) return 'bg-red-200 font-semibold';
    if (point === top2Points[1]) return 'bg-red-100 font-semibold';
    return '';
  };

  const getWinRateClass = (winRate: number) => {
    if (winRate === top2WinRates[0]) return 'bg-green-200 font-semibold';
    if (winRate === top2WinRates[1]) return 'bg-green-100 font-semibold';
    return '';
  };

  const getMarginClass = (margin: number) => {
    if (margin === top2Margins[0]) return 'bg-sky-200 font-semibold';
    if (margin === top2Margins[1]) return 'bg-sky-100 font-semibold';
    return '';
  };

  const handleNameClick = (name: string) => {
    router.push(`/player/${encodeURIComponent(name)}`);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="table w-full text-center text-sm">
          <thead>
            <tr>
              <th>순위</th>
              <th>이름</th>
              <th>승</th>
              <th>무</th>
              <th>패</th>
              <th>게임</th>
              <th>승점</th>
              <th>승률</th>
              <th>득점</th>
              <th>실점</th>
              <th>마진</th>
            </tr>
          </thead>
          <tbody>
            {displayStats.map((row, idx) => (
              <tr key={row.name}>
                <td>{idx + 1}</td>
                <td>
                  <div
                    className="whitespace-nowrap cursor-pointer text-blue-700 hover:text-blue-900 transition-colors underline underline-offset-4"
                    onClick={() => handleNameClick(row.name)}
                  >
                    {row.name}
                  </div>
                </td>
                <td className="text-green-600 font-semibold">{row.win}</td>
                <td className="text-yellow-600">{row.draw}</td>
                <td className="text-red-600">{row.lose}</td>
                <td>{row.game}</td>
                <td
                  className={`font-semibold text-blue-600 ${getPointClass(row.point)}`}
                >
                  {row.point}
                </td>
                <td className={getWinRateClass(row.winRate)}>
                  {(row.winRate * 100).toFixed(1)}%
                </td>
                <td>{row.score}</td>
                <td>{row.loseScore}</td>
                <td className={getMarginClass(row.margin)}>
                  {row.margin > 0 ? '+' : ''}
                  {row.margin}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  const { user } = useAuthRedirect('/', 0);
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
  //       <h2 className="text-xl font-semibold text-gray-800 mb-4">전체순위</h2>
  //       <LoadingGrid loading={true} />
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">전체순위</h2>
        <div className="text-center py-20 text-lg text-red-500 overflow-x-auto">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">전체순위</h2>
        <div className="text-center py-20 text-lg text-gray-500">
          조회된 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="print-hidden">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">전체순위</h2>
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
