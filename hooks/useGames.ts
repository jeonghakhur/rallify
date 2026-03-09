// import { Match } from "@/model/match";

import { GameResult, Game, GameComment } from '@/model/gameResult';
import useSWR, { useSWRConfig } from 'swr';

// 공통 fetch 헬퍼
async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorMsg = 'Unknown error';
    try {
      const text = await res.text();
      try {
        const err = JSON.parse(text);
        errorMsg = err?.error || text;
      } catch {
        errorMsg = text;
      }
    } catch {}
    throw new Error(errorMsg);
  }
  return res.json();
}

// 게임 결과 삭제 (gameResultId 기준)
async function deleteGame(gameResultId: string) {
  return fetchJson(`/api/games/${gameResultId}`, { method: 'DELETE' });
}

// 게임 결과 수정 (gameResultId 기준)
async function updateGame(
  gameResultId: string,
  matches: Game[],
  status?: GameResult['status'],
  editor?: GameResult['lastEditor']
) {
  return fetchJson(`/api/games/${gameResultId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matches, status, editor }),
  });
}

// 코멘트 추가/삭제
async function addCommentToGameResult(
  gameResultId: string,
  comment: GameComment
) {
  return fetchJson(`/api/gameResult/${gameResultId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  });
}
async function removeCommentFromGameResult(
  gameResultId: string,
  commentKey: string
) {
  return fetchJson(`/api/gameResult/${gameResultId}/comments`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentKey }),
  });
}

export default function useGame(gameResultId: string) {
  const {
    data: game,
    isLoading,
    error,
    mutate,
  } = useSWR<GameResult>(`/api/games/${gameResultId}`, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const { mutate: globalMutate } = useSWRConfig();

  // 게임 결과 삭제
  const removeGame = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteGame(id);
      globalMutate('/api/games', undefined, { revalidate: true });
      return { success: true };
    } catch (error) {
      console.error('게임 삭제 중 오류:', error);
      await globalMutate('/api/games');
      return { success: false, error: '게임 삭제 중 오류가 발생했습니다.' };
    }
  };

  // 게임 결과 수정
  const updateGameData = async (
    id: string,
    matches: Game[],
    status?: GameResult['status'],
    editor?: GameResult['lastEditor']
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateGame(id, matches, status, editor);
      globalMutate(`/api/games/${id}`, undefined, { revalidate: true });
      globalMutate('/api/games', undefined, { revalidate: true });
      return { success: true };
    } catch (error) {
      console.error('게임 업데이트 중 오류:', error);
      return { success: false, error: '게임 업데이트 중 오류가 발생했습니다.' };
    }
  };

  // 코멘트 추가
  const addComment = async (comment: GameComment) => {
    if (!game) return;
    const newComments = [...(game.comments || []), comment];
    const newGame = { ...game, comments: newComments } as GameResult;
    return mutate(
      async () => {
        await addCommentToGameResult(game._id!, comment);
        return { ...game, comments: newComments };
      },
      {
        optimisticData: newGame,
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    );
  };

  // 코멘트 삭제
  const removeComment = async (commentKey: string) => {
    if (!game) return;
    const updatedComments = (game.comments || []).filter(
      (comment: GameComment) => comment._key !== commentKey
    );
    const newGame = { ...game, comments: updatedComments } as GameResult;
    return mutate(
      async () => {
        await removeCommentFromGameResult(game._id!, commentKey);
        return { ...game, comments: updatedComments };
      },
      {
        optimisticData: newGame,
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    );
  };

  return {
    game,
    isLoading,
    error,
    removeGame,
    updateGameData,
    addComment,
    removeComment,
  };
}
