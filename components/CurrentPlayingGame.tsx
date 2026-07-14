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
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const gameApi = useGame(data?.scheduleID || '');

  useEffect(() => {
    if (data && data.games) {
      setEditableGames([...data.games]);
    }
  }, [data]);

  // 코트 목록 (칩 필터)
  const courts = useMemo(() => {
    const set = new Set(
      (data?.games ?? []).map((g) => g.court).filter(Boolean)
    );
    return Array.from(set).sort();
  }, [data?.games]);

  // 기본은 첫 코트만 펼쳐 홈 스크롤을 줄인다
  useEffect(() => {
    if (courts.length > 1 && selectedCourt === null) {
      setSelectedCourt(courts[0] ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courts]);

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
    const gameResultId = data.id ?? data._id;
    if (!gameResultId) return;
    setDataLoading(true);
    try {
      const result = await gameApi.updateGameData?.(
        gameResultId,
        editableGames
      );
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
    return format(new Date(data.date), 'M월 d일 (EEE)', {
      locale: ko,
    });
  }, [data?.date]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-muted rounded"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
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

  const visibleGames = editableGames
    .map((game, index) => ({ game, index }))
    .filter(({ game }) => !selectedCourt || game.court === selectedCourt);

  return (
    <section className="print-hidden">
      {dataLoading && <LoadingGrid loading={true} />}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 text-[15px] font-extrabold">
          지금 코트에서
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-clay">
            <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
            LIVE
          </span>
        </h3>
        <div className="text-xs font-semibold text-muted-foreground">
          {formattedDate} · {data.courtName}
          {userLevel >= 3 && (
            <Link
              href={`/games/${data.scheduleID}`}
              className="ml-2 font-bold text-primary dark:text-accent"
            >
              전체 {data.games.length}경기 →
            </Link>
          )}
        </div>
      </div>

      {courts.length > 1 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto px-1">
          <button
            type="button"
            onClick={() => setSelectedCourt(null)}
            className={
              'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold ' +
              (selectedCourt === null
                ? 'border-transparent bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground'
                : 'border-border bg-card text-muted-foreground')
            }
          >
            전체
          </button>
          {courts.map((court) => (
            <button
              key={court}
              type="button"
              onClick={() => setSelectedCourt(court)}
              className={
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold ' +
                (selectedCourt === court
                  ? 'border-transparent bg-primary text-primary-foreground dark:bg-accent dark:text-accent-foreground'
                  : 'border-border bg-card text-muted-foreground')
              }
            >
              {court}코트
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-2.5">
        {visibleGames.map(({ game, index }) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="mb-2.5 flex items-center justify-between text-[11px] font-bold tracking-wide text-muted-foreground">
              <span>
                GAME {index + 1}
                {game.court && ` · ${game.court}코트`}
              </span>
              <span>{game.time}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-1.5 py-0.5">
                  <Input
                    value={game.players?.[0] ?? ''}
                    onChange={(e) =>
                      handlePlayerChange(index, 0, e.target.value)
                    }
                    className="h-9 border-transparent bg-transparent px-2 text-[15px] font-bold focus-visible:border-input"
                  />
                  <Input
                    value={game.players?.[1] ?? ''}
                    onChange={(e) =>
                      handlePlayerChange(index, 1, e.target.value)
                    }
                    className="h-9 border-transparent bg-transparent px-2 text-[15px] font-bold focus-visible:border-input"
                  />
                  <Input
                    value={game.score?.[0] ?? ''}
                    onChange={(e) =>
                      handleScoreChange(index, 0, e.target.value)
                    }
                    inputMode="numeric"
                    className="h-10 w-12 border-border bg-background text-center text-xl font-black tabular-nums"
                  />
                </div>
                <div className="my-0.5 border-t border-dashed border-border" />
                <div className="flex items-center gap-1.5 py-0.5">
                  <Input
                    value={game.players?.[2] ?? ''}
                    onChange={(e) =>
                      handlePlayerChange(index, 2, e.target.value)
                    }
                    className="h-9 border-transparent bg-transparent px-2 text-[15px] font-bold focus-visible:border-input"
                  />
                  <Input
                    value={game.players?.[3] ?? ''}
                    onChange={(e) =>
                      handlePlayerChange(index, 3, e.target.value)
                    }
                    className="h-9 border-transparent bg-transparent px-2 text-[15px] font-bold focus-visible:border-input"
                  />
                  <Input
                    value={game.score?.[1] ?? ''}
                    onChange={(e) =>
                      handleScoreChange(index, 1, e.target.value)
                    }
                    inputMode="numeric"
                    className="h-10 w-12 border-border bg-background text-center text-xl font-black tabular-nums"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-auto self-stretch"
                onClick={() => handleGameUpdate(index)}
              >
                등록
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
