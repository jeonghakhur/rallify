'use client';

import { Container } from '@/components/Layout';
import { use, useEffect, useState } from 'react';
import useGame from '@/hooks/useGames';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import CommentSection from '@/components/common/CommentSection';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { Game, GameResult } from '@/model/gameResult';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import Skeleton from '@/components/common/Skeleton';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

type Props = {
  params: Promise<{ id: string }>;
};

export default function Page({ params }: Props) {
  const { id } = use(params);
  const {
    game,
    isLoading,
    removeGame,
    updateGameData,
    addComment,
    removeComment,
  } = useGame(id);
  const [loading, setLoading] = useState<boolean>(isLoading);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [editableGames, setEditableGames] = useState<Game[]>([]);
  const [gameStatus, setGameStatus] = useState<GameResult['status']>();
  const router = useRouter();

  // 사용자 인증 정보 가져오기
  const { user } = useAuthRedirect('/', 0);

  // 수정 가능 여부 확인 (레벨 3 이상)
  const canEdit = typeof user?.level === 'number' && user.level >= 3;

  // 새 게임 기본 객체 생성 함수
  const createEmptyGame = () => ({
    court: '',
    players: ['', '', '', ''],
    score: ['', ''],
    time: '',
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGame, setNewGame] = useState(createEmptyGame());

  useEffect(() => {
    if (game) {
      console.log('게임 데이터:', game);
      setEditableGames([...game.games]);
      setGameStatus(game.status);
      setLoading(false);
    }
  }, [game]);

  const handleDelete = async (id: string) => {
    const isConfirmed = confirm('정말 삭제하시겠습니까?');
    if (!isConfirmed) return;

    setDataLoading(true);
    try {
      const result = await removeGame(id);

      if (result.success) {
        // 게임 결과 삭제 성공 시 스케줄 상태를 pending으로 변경
        if (game?.scheduleID) {
          console.log(
            '🔄 스케줄 상태를 pending으로 변경 시작:',
            game.scheduleID
          );
          const response = await fetch(`/api/schedule/${game.scheduleID}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'pending' }),
          });

          console.log(
            '📡 스케줄 상태 업데이트 응답:',
            response.status,
            response.statusText
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 스케줄 상태 업데이트 실패:', errorText);
          } else {
            const responseData = await response.json();
            console.log('✅ 스케줄 상태 업데이트 성공:', responseData);
          }
        } else {
          console.warn('⚠️ scheduleID가 없습니다:', game);
        }
      } else {
        // 에러 발생 시 사용자에게 알림
        alert(result.error || '삭제 중 오류가 발생했습니다.');
        setDataLoading(false);
        return;
      }
    } catch (error) {
      console.error('게임 삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      // setLoading(false);
      // 성공/실패와 관계없이 목록 페이지로 이동
      router.push('/games');
    }
  };

  const handleUpdate = async function (id: string) {
    const isConfirmed = confirm('게임 정보를 수정하시겠습니까?');
    if (!isConfirmed) return;

    setDataLoading(true);
    try {
      // 게임 데이터 업데이트
      const gameResult = await updateGameData(id, editableGames, gameStatus);
      if (gameResult.success) {
        toast({
          title: '게임 정보가 성공적으로 수정되었습니다.',
          duration: 1500,
        });
        // setTimeout(() => router.push('/games'), 1500);
      } else {
        alert(gameResult.error || '수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('게임 수정 중 오류:', error);
      alert('수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleGameUpdate = async function (gameIndex: number) {
    if (!game) return;

    const isConfirmed = confirm(`게임 ${gameIndex + 1}을 수정하시겠습니까?`);
    if (!isConfirmed) return;

    setDataLoading(true);
    try {
      const result = await updateGameData(game._id!, editableGames);

      if (result.success) {
        toast({
          title: `게임 ${gameIndex + 1}이 성공적으로 수정되었습니다.`,
          duration: 1500,
        });
      } else {
        alert(result.error || '수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('게임 수정 중 오류:', error);
      alert('수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleGameDelete = async function (gameIndex: number) {
    if (!game) return;

    const isConfirmed = confirm(`게임 ${gameIndex + 1}을 삭제하시겠습니까?`);
    if (!isConfirmed) return;

    setDataLoading(true);
    try {
      // 해당 게임을 배열에서 제거
      const updatedGames = editableGames.filter(
        (_, index) => index !== gameIndex
      );

      if (updatedGames.length === 0) {
        // 모든 게임이 삭제되면 전체 게임 결과를 삭제하고 스케줄 상태를 pending으로 변경
        const result = await removeGame(game._id!);
        if (result.success) {
          // 스케줄 상태를 pending으로 변경
          if (game.scheduleID) {
            console.log(
              '🔄 개별 게임 삭제 후 스케줄 상태를 pending으로 변경:',
              game.scheduleID
            );
            const response = await fetch(`/api/schedule/${game.scheduleID}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'pending' }),
            });

            console.log(
              '📡 개별 삭제 후 스케줄 상태 업데이트 응답:',
              response.status
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                '❌ 개별 삭제 후 스케줄 상태 업데이트 실패:',
                errorText
              );
            } else {
              const responseData = await response.json();
              console.log(
                '✅ 개별 삭제 후 스케줄 상태 업데이트 성공:',
                responseData
              );
            }
          }
        } else {
          alert(result.error || '삭제 중 오류가 발생했습니다.');
        }
        router.push('/games');
        return;
      }

      // 남은 게임들로 업데이트 (일부 게임만 삭제되므로 스케줄 상태는 match_done 유지)
      const result = await updateGameData(game._id!, updatedGames);

      if (result.success) {
        setEditableGames(updatedGames);
        toast({
          title: `게임 ${gameIndex + 1}이 성공적으로 삭제되었습니다.`,
          duration: 1500,
        });
      } else {
        alert(result.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('게임 삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setDataLoading(false);
    }
  };

  const handlePlayerChange = (
    gameIndex: number,
    playerIndex: number | string,
    value: string
  ) => {
    const updatedGames = [...editableGames];
    let changed = false;
    if (typeof playerIndex === 'number') {
      if (updatedGames[gameIndex]?.players) {
        updatedGames[gameIndex].players[playerIndex] = value;
        changed = true;
      }
    } else if (playerIndex === 'court' || playerIndex === 'time') {
      if (updatedGames[gameIndex]) {
        updatedGames[gameIndex][playerIndex] = value;
        changed = true;
      }
    }
    if (changed) setEditableGames(updatedGames);
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

  // 게임 추가 핸들러(다이얼로그 등록용)
  const handleAddGameFromDialog = async () => {
    if (!game) return;
    const updatedGames = [...editableGames, newGame];
    updatedGames.sort((a, b) => {
      // 시간 형식이 'HH:mm'일 때 오름차순 정렬
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    setEditableGames(updatedGames);
    setDataLoading(true);
    try {
      const result = await updateGameData(game._id!, updatedGames, gameStatus);
      if (result.success) {
        toast({ title: '게임이 등록되었습니다.', duration: 1500 });
        setDialogOpen(false);
        setNewGame(createEmptyGame());
      } else {
        toast({
          title: result.error || '등록 중 오류',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: '등록 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setDataLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Skeleton lines={3} />
      </Container>
    );
  }

  if (!game) {
    return (
      <Container>
        <div className="text-center py-8">게임 정보를 찾을 수 없습니다.</div>
      </Container>
    );
  }

  return (
    <Container>
      {dataLoading && <Skeleton lines={3} />}

      <div className="pb-10">
        <div className="bg-white rounded-lg shadow-md p-3 mb-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {game.courtName}
            </h1>
            <div className="text-lg text-gray-600">
              {game.date
                ? format(new Date(game.date), 'yyyy년 MM월 dd일 (EEE)', {
                    locale: ko,
                  })
                : '날짜 정보 없음'}
            </div>
          </div>
        </div>

        {/* 게임 결과 노출 설정 - 관리자만 표시 */}
        {canEdit && (
          <div className="flex items-center gap-2 my-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="default" size="sm" className="">
                  + 게임 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>새 게임 추가</DialogTitle>
                <div className="flex flex-col gap-2 mt-4">
                  <Input
                    value={newGame.time ?? ''}
                    onChange={(e) =>
                      setNewGame({ ...newGame, time: e.target.value })
                    }
                    placeholder="시간(예: 19:00)"
                    className="w-full"
                  />
                  <Input
                    value={newGame.court ?? ''}
                    onChange={(e) =>
                      setNewGame({ ...newGame, court: e.target.value })
                    }
                    placeholder="코트"
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newGame.players?.[0] ?? ''}
                      onChange={(e) =>
                        setNewGame({
                          ...newGame,
                          players: [
                            e.target.value,
                            newGame.players?.[1] ?? '',
                            newGame.players?.[2] ?? '',
                            newGame.players?.[3] ?? '',
                          ],
                        })
                      }
                      placeholder="선수 1"
                      className="w-full"
                    />
                    <Input
                      value={newGame.players?.[1] ?? ''}
                      onChange={(e) =>
                        setNewGame({
                          ...newGame,
                          players: [
                            newGame.players?.[0] ?? '',
                            e.target.value,
                            newGame.players?.[2] ?? '',
                            newGame.players?.[3] ?? '',
                          ],
                        })
                      }
                      placeholder="선수 2"
                      className="w-full"
                    />
                    <Input
                      value={newGame.score?.[0] ?? ''}
                      onChange={(e) =>
                        setNewGame({
                          ...newGame,
                          score: [e.target.value, newGame.score?.[1] ?? ''],
                        })
                      }
                      placeholder="점수 1"
                      className="w-16 text-center"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newGame.players?.[2] ?? ''}
                      onChange={(e) =>
                        setNewGame({
                          ...newGame,
                          players: [
                            newGame.players?.[0] ?? '',
                            newGame.players?.[1] ?? '',
                            e.target.value,
                            newGame.players?.[3] ?? '',
                          ],
                        })
                      }
                      placeholder="선수 3"
                      className="w-full"
                    />
                    <Input
                      value={newGame.players?.[3] ?? ''}
                      onChange={(e) =>
                        setNewGame({
                          ...newGame,
                          players: [
                            newGame.players?.[0] ?? '',
                            newGame.players?.[1] ?? '',
                            newGame.players?.[2] ?? '',
                            e.target.value,
                          ],
                        })
                      }
                      placeholder="선수 4"
                      className="w-full"
                    />
                    <Input
                      value={newGame.score?.[1] ?? ''}
                      onChange={(e) =>
                        setNewGame({
                          ...newGame,
                          score: [newGame.score?.[0] ?? '', e.target.value],
                        })
                      }
                      placeholder="점수 2"
                      className="w-16 text-center"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    type="button"
                    onClick={handleAddGameFromDialog}
                    className="flex-1"
                  >
                    등록
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="flex-1">
                      취소
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
            <label htmlFor="status" className="ml-auto font-bold">
              게임 상태
            </label>
            <Select
              value={gameStatus || 'wait'}
              onValueChange={(v) => setGameStatus(v as GameResult['status'])}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="playing">게임 진행중</SelectItem>
                <SelectItem value="done">게임완료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-4">
          {editableGames.map((result, index) => {
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex gap-2">
                  <div className="flex flex-col justify-center items-center ">
                    <div className="font-semibold whitespace-nowrap">
                      게임 {index + 1}
                    </div>
                    <div className="text-sm text-gray-500">{result.time}</div>
                    <div className="text-sm text-gray-500">
                      {result.court} 코트
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        value={result.players[0]}
                        onChange={(e) =>
                          handlePlayerChange(index, 0, e.target.value)
                        }
                        className=""
                      />
                      <Input
                        value={result.players[1]}
                        onChange={(e) =>
                          handlePlayerChange(index, 1, e.target.value)
                        }
                        className=""
                      />
                      <Input
                        value={result.score[0]}
                        onChange={(e) =>
                          handleScoreChange(index, 0, e.target.value)
                        }
                        className="text-center w-10"
                      />
                    </div>

                    {/* 페어 B */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={result.players[2]}
                        onChange={(e) =>
                          handlePlayerChange(index, 2, e.target.value)
                        }
                        className="w-full"
                      />
                      <Input
                        value={result.players[3]}
                        onChange={(e) =>
                          handlePlayerChange(index, 3, e.target.value)
                        }
                        className="w-full"
                      />
                      <Input
                        value={result.score[1]}
                        onChange={(e) =>
                          handleScoreChange(index, 1, e.target.value)
                        }
                        className="w-10 text-center"
                      />
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleGameUpdate(index)}
                      >
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleGameDelete(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-8 w-full"
          onClick={() => router.push('/games')}
        >
          목록으로
        </Button>

        {/* 전체 수정/삭제 버튼 - 관리자만 표시 */}
        {canEdit && (
          <div className="flex gap-2 mt-8 mb-10">
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="flex-1"
              onClick={() => handleDelete(game._id!)}
            >
              전체 삭제
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              onClick={() => handleUpdate(game._id!)}
            >
              전체 수정
            </Button>
          </div>
        )}

        {/* 게임 결과 코멘트 섹션 */}
        {user && game && (
          <CommentSection
            comments={game.comments || []}
            currentUserId={user.id}
            currentUser={{
              name: user.name || '',
              username: user.userName || user.name || '',
              ...(user.image && { image: user.image }),
            }}
            onAddComment={async (comment) => {
              await addComment(comment);
            }}
            onRemoveComment={async (commentKey) => {
              await removeComment(commentKey);
            }}
            title="게임 결과 코멘트"
            placeholder="게임 결과에 대한 코멘트를 입력하세요..."
          />
        )}
      </div>
    </Container>
  );
}
