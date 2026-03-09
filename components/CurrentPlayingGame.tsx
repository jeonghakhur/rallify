'use client';

import { Game, GameResult } from '@/model/gameResult';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import useGame from '@/hooks/useGames';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import LoadingGrid from '@/components/LoadingGrid';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface Props {
  data: GameResult | undefined;
  isLoading: boolean;
  mutate: () => void;
}

export default function CurrentPlayingGame({ data, isLoading, mutate }: Props) {
  const { data: session } = useSession();
  const userLevel = session?.user?.level ?? 0;
  const [editableGames, setEditableGames] = useState<Game[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const gameApi = useGame(data?.scheduleID || '');

  useEffect(() => {
    if (data && data.games) {
      setEditableGames([...data.games]);
    }
  }, [data]);

  // 인풋 핸들러
  const handlePlayerChange = (
    gameIndex: number,
    playerIndex: number,
    value: string
  ) => {
    const updatedGames = [...editableGames];
    if (updatedGames[gameIndex]?.players) {
      updatedGames[gameIndex].players[playerIndex] = value;
      setEditableGames(updatedGames);
    }
  };
  const handleScoreChange = (
    gameIndex: number,
    scoreIndex: number,
    value: string
  ) => {
    const updatedGames = [...editableGames];
    if (updatedGames[gameIndex]?.score) {
      updatedGames[gameIndex].score[scoreIndex] = value;
      setEditableGames(updatedGames);
    }
  };
  // 게임별 수정
  const handleGameUpdate = async (gameIndex: number) => {
    if (!data || !data.scheduleID) return;
    setDataLoading(true);
    try {
      const result = await gameApi.updateGameData?.(data._id!, editableGames);
      if (result?.success) {
        toast({
          title: `게임 ${gameIndex + 1}이 성공적으로 수정되었습니다.`,
          duration: 1500,
        });
        mutate();
      } else {
        toast({
          title: result?.error || '수정 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: '수정 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setDataLoading(false);
    }
  };

  const formattedDate = useMemo(() => {
    if (!data?.date) return '';
    return format(new Date(data.date), 'yyyy년 MM월 dd일 (EEE)', {
      locale: ko,
    });
  }, [data?.date]);

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

  if (!data) {
    return null;
  }

  if (userLevel < 1) {
    return null;
  }

  return (
    <div className="print-hidden">
      {dataLoading && <LoadingGrid loading={true} />}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">진행중 게임</h3>
        <div className="text-sm text-gray-600">
          {formattedDate} • {data.courtName}
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-semibold text-gray-700">
          (현재 진행중 총 {data.games.length}게임)
        </div>
        {/* 레벨 3 이상만 노출되는 게임 결과 상세 페이지 이동 버튼 */}
        {userLevel >= 3 && (
          <div className="flex justify-end">
            <Link
              href={`/games/${data.scheduleID}`}
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
            </Link>
          </div>
        )}
      </div>
      <div className="grid gap-4">
        {editableGames &&
          editableGames.map((result, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center px-2 mb-2">
                <div className="font-semibold whitespace-nowrap">
                  게임 {index + 1}
                </div>
                <div className="text-sm text-gray-600">
                  {result.court && `${result.court}코트 `}
                  {result.time}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      value={result.players?.[0] ?? ''}
                      onChange={(e) =>
                        handlePlayerChange(index, 0, e.target.value)
                      }
                    />
                    <Input
                      value={result.players?.[1] ?? ''}
                      onChange={(e) =>
                        handlePlayerChange(index, 1, e.target.value)
                      }
                    />
                    <Input
                      value={result.score?.[0] ?? ''}
                      onChange={(e) =>
                        handleScoreChange(index, 0, e.target.value)
                      }
                      className="text-center w-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={result.players?.[2] ?? ''}
                      onChange={(e) =>
                        handlePlayerChange(index, 2, e.target.value)
                      }
                      className="w-full"
                    />
                    <Input
                      value={result.players?.[3] ?? ''}
                      onChange={(e) =>
                        handlePlayerChange(index, 3, e.target.value)
                      }
                      className="w-full"
                    />
                    <Input
                      value={result.score?.[1] ?? ''}
                      onChange={(e) =>
                        handleScoreChange(index, 1, e.target.value)
                      }
                      className="w-10 text-center"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleGameUpdate(index)}
                  >
                    등록
                  </Button>
                  {/* <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleGameDelete(index)}
                  >
                    삭제
                  </Button> */}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
