import { createGameResult, getGame, updateGameResult } from '@/service/games';
import { updateScheduleStatus } from '@/service/schedule';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return await withSessionUser(async (user) => {
    const { scheduleId, matches, status } = await req.json();

    const game = await getGame(scheduleId);

    if (game) {
      // 기존 게임이 있어도 status가 전송되었다면 업데이트
      const gameResult = await updateGameResult(game._id, matches);
      if (status) {
        await updateScheduleStatus(scheduleId, status);
      }
      return NextResponse.json(gameResult);
    } else {
      // 게임 결과 생성 후 스케줄 status를 클라이언트에서 전송한 값으로 업데이트
      const gameResult = await createGameResult(scheduleId, user.id, matches);
      const targetStatus = status || 'match_done'; // 기본값은 match_done
      await updateScheduleStatus(scheduleId, targetStatus);

      return NextResponse.json(gameResult);
    }
  });
}

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  const { id } = await context.params; // params를 비동기로 처리

  return withSessionUser(async () =>
    getGame(id) //
      .then((data) => NextResponse.json(data))
  );
}
