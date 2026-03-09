'use client';

import { Container } from '@/components/Layout';
import { GameResult } from '@/model/gameResult';
import LoadingGrid from '@/components/LoadingGrid';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { useState } from 'react';

type PlayerGameResult = {
  date: string;
  courtName: string;
  team: string;
  opponent: string;
  score: string;
  result: 'win' | 'lose' | 'draw';
  gameNumber: number;
};

type PairStats = {
  partner: string;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
};

export default function PlayerGameHistory() {
  const params = useParams();
  const router = useRouter();
  const {
    data: games,
    isLoading,
    error,
  } = useSWR<GameResult[]>('/api/games?status=done');
  const [currentPage, setCurrentPage] = useState(0);
  const [showAllPairs, setShowAllPairs] = useState(false);

  const playerName = params?.name
    ? decodeURIComponent(params.name as string)
    : '';

  if (!playerName) {
    return (
      <Container>
        <div className="text-center py-20 text-lg text-red-500">
          플레이어 정보를 찾을 수 없습니다.
        </div>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <div className="text-center py-20">
          <LoadingGrid loading={isLoading} />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-center py-20 text-lg text-red-500">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </Container>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Container>
        <div className="text-center py-20 text-lg text-gray-500">
          게임 데이터가 없습니다.
        </div>
      </Container>
    );
  }

  // 플레이어의 모든 게임 결과 추출
  const playerGames: PlayerGameResult[] = [];

  games.forEach((gameResult) => {
    gameResult.games.forEach((game, gameIndex) => {
      const [scoreA = 0, scoreB = 0] = game.score.map(Number);
      const teamA = [game.players[0], game.players[1]].filter(
        (p): p is string => !!p
      );
      const teamB = [game.players[2], game.players[3]].filter(
        (p): p is string => !!p
      );

      // 플레이어가 팀A에 있는지 확인
      if (teamA.includes(playerName)) {
        const result =
          scoreA > scoreB ? 'win' : scoreA < scoreB ? 'lose' : 'draw';
        playerGames.push({
          date: gameResult.date,
          courtName: gameResult.courtName,
          team: teamA.join(', '),
          opponent: teamB.join(', '),
          score: `${scoreA}:${scoreB}`,
          result,
          gameNumber: gameIndex + 1,
        });
      }

      // 플레이어가 팀B에 있는지 확인
      if (teamB.includes(playerName)) {
        const result =
          scoreB > scoreA ? 'win' : scoreB < scoreA ? 'lose' : 'draw';
        playerGames.push({
          date: gameResult.date,
          courtName: gameResult.courtName,
          team: teamB.join(', '),
          opponent: teamA.join(', '),
          score: `${scoreB}:${scoreA}`,
          result,
          gameNumber: gameIndex + 1,
        });
      }
    });
  });

  // 날짜순으로 정렬 (최신순)
  playerGames.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 통계 계산
  const totalGames = playerGames.length;
  const wins = playerGames.filter((game) => game.result === 'win').length;
  const draws = playerGames.filter((game) => game.result === 'draw').length;
  const losses = playerGames.filter((game) => game.result === 'lose').length;
  const winRate =
    totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

  // 페어별 통계 계산
  const pairStats: Record<string, PairStats> = {};

  playerGames.forEach((game) => {
    const teamMembers = game.team
      .split(', ')
      .filter((member) => member.trim() !== '');
    const partner = teamMembers.find((member) => member !== playerName);

    if (partner) {
      if (!pairStats[partner]) {
        pairStats[partner] = {
          partner,
          totalGames: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          winRate: 0,
        };
      }

      pairStats[partner].totalGames += 1;
      if (game.result === 'win') pairStats[partner].wins += 1;
      else if (game.result === 'draw') pairStats[partner].draws += 1;
      else pairStats[partner].losses += 1;
    }
  });

  // 승률 계산
  Object.values(pairStats).forEach((pair) => {
    pair.winRate =
      pair.totalGames > 0 ? (pair.wins / pair.totalGames) * 100 : 0;
  });

  // 승률순으로 정렬
  const sortedPairs = Object.values(pairStats).sort(
    (a, b) => b.winRate - a.winRate
  );

  // 1경기 이상 함께 뛴 페어만 필터링
  const qualifiedPairs = sortedPairs.filter((pair) => pair.totalGames >= 1);

  const handleTeamClick = (team: string) => {
    const teamMembers = team
      .split(', ')
      .filter((member) => member.trim() !== '');
    if (teamMembers.length === 2) {
      const sortedMembers = teamMembers.sort();
      const pairUrl = `/pair/${sortedMembers.join('+')}`;
      router.push(pairUrl);
    }
  };

  const handlePairClick = (partner: string) => {
    const sortedMembers = [playerName, partner].sort();
    const pairUrl = `/pair/${sortedMembers.join('+')}`;
    router.push(pairUrl);
  };

  return (
    <Container>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {playerName}님의 게임 기록
          </h1>
          <p className="text-gray-600">
            총 {totalGames}경기 • {wins}승 {draws}무 {losses}패 • 승률 {winRate}
            %
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-blue-600">{totalGames}</div>
            <div className="text-sm text-gray-600">총 경기</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-green-600">{wins}</div>
            <div className="text-sm text-gray-600">승</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-yellow-600">{draws}</div>
            <div className="text-sm text-gray-600">무</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-red-600">{losses}</div>
            <div className="text-sm text-gray-600">패</div>
          </div>
        </div>

        {/* 페어 통계 */}
        {qualifiedPairs.length > 0 && (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              페어별 승률 (1경기 이상) - {qualifiedPairs.length}명
            </h3>

            {/* 페어가 많을 때 페이지네이션 */}
            {qualifiedPairs.length > 10 && (
              <div className="mb-4 flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                  >
                    이전
                  </button>
                  <span className="px-3 py-1 text-sm">
                    {currentPage + 1} / {Math.ceil(qualifiedPairs.length / 10)}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(
                        Math.min(
                          Math.ceil(qualifiedPairs.length / 10) - 1,
                          currentPage + 1
                        )
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(qualifiedPairs.length / 10) - 1
                    }
                    className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={qualifiedPairs
                    .slice(currentPage * 10, (currentPage + 1) * 10)
                    .map((pair, index) => ({
                      name: pair.partner,
                      순위: currentPage * 10 + index + 1,
                      승리: pair.wins,
                      패배: -pair.losses, // 마이너스 값으로 표시
                      승: pair.wins,
                      무: pair.draws,
                      패: pair.losses,
                    }))}
                  margin={{
                    top: 5,
                    right: 5,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={qualifiedPairs.length > 15 ? 10 : 12}
                    interval={0}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[
                      (dataMin: number) => Math.min(dataMin, -5),
                      (dataMax: number) => Math.max(dataMax, 5),
                    ]}
                    tickFormatter={(value) => `${Math.abs(value)}경기`}
                    fontSize={10}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === '승리') return [value, '승리'];
                      if (name === '패배')
                        return [
                          typeof value === 'number' ? Math.abs(value) : value,
                          '패배',
                        ];
                      if (name === '순위') return [value, '순위'];
                      if (name === '승') return [value, '승'];
                      if (name === '무') return [value, '무'];
                      if (name === '패') return [value, '패'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `파트너: ${label}`}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="승리"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      if (data && data.name) {
                        handlePairClick(data.name);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    name="승리"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="패배"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      if (data && data.name) {
                        handlePairClick(data.name);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    name="패배"
                  />
                  <ReferenceLine y={0} stroke="#000" yAxisId="left" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 전체 페어 목록 링크 */}
            {qualifiedPairs.length > 10 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllPairs(!showAllPairs)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  {showAllPairs ? '차트로 보기' : '전체 페어 목록 보기'}
                </button>
              </div>
            )}

            {/* 전체 페어 목록 테이블 */}
            {showAllPairs && qualifiedPairs.length > 10 && (
              <div className="mt-4 overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>파트너</th>
                      <th>승률</th>
                      <th>총 경기</th>
                      <th>승/무/패</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualifiedPairs.map((pair, index) => (
                      <tr key={pair.partner} className="border-t">
                        <td>{index + 1}</td>
                        <td
                          className="cursor-pointer text-blue-600 underline hover:text-blue-800"
                          onClick={() => handlePairClick(pair.partner)}
                        >
                          {pair.partner}
                        </td>
                        <td
                          className={
                            pair.winRate >= 50
                              ? 'text-green-600'
                              : pair.winRate >= 30
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }
                        >
                          {pair.winRate.toFixed(1)}%
                        </td>
                        <td>{pair.totalGames}</td>
                        <td>
                          {pair.wins}/{pair.draws}/{pair.losses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600 text-center">
              <span className="inline-block mr-4">
                <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>
                50% 이상
              </span>
              <span className="inline-block mr-4">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded mr-1"></span>
                30-49%
              </span>
              <span className="inline-block">
                <span className="inline-block w-3 h-3 bg-red-500 rounded mr-1"></span>
                30% 미만
              </span>
            </div>
          </div>
        )}

        {/* 게임 기록 테이블 */}
        {playerGames.length > 0 ? (
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left">날짜</th>
                    <th className="text-left">장소</th>
                    <th className="text-left">팀</th>
                    <th className="text-left">상대팀</th>
                    <th className="text-center">스코어</th>
                    <th className="text-center">결과</th>
                  </tr>
                </thead>
                <tbody>
                  {playerGames.map((game, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {format(new Date(game.date), 'MM.dd')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(game.date), 'EEEE', { locale: ko })}
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-900">
                        {game.courtName}
                      </td>
                      <td className="py-3 text-sm text-gray-900">
                        <span
                          className="cursor-pointer text-blue-600 underline hover:text-blue-800"
                          onClick={() => handleTeamClick(game.team)}
                          title={`${game.team} 페어 기록 보기`}
                        >
                          {game.team}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-900">
                        <span
                          className="cursor-pointer text-blue-600 underline hover:text-blue-800"
                          onClick={() => handleTeamClick(game.opponent)}
                          title={`${game.opponent} 페어 기록 보기`}
                        >
                          {game.opponent}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {game.score}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            game.result === 'win'
                              ? 'bg-green-100 text-green-800'
                              : game.result === 'draw'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {game.result === 'win'
                            ? '승'
                            : game.result === 'draw'
                              ? '무'
                              : '패'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-lg text-gray-500">
            {playerName}님의 게임 기록이 없습니다.
          </div>
        )}
      </div>
    </Container>
  );
}
