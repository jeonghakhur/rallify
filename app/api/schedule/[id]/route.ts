import {
  deleteSchedule,
  getSchedule,
  updateSchedule,
  updateScheduleStatus,
} from '@/service/schedule';
import { withSessionUser } from '@/util/session';
import { getGameIdByScheduleId, deleteGame } from '@/service/games';

import { NextRequest, NextResponse } from 'next/server';

type Context = {
  params: Promise<{ id: string }>; // params가 Promise로 감싸져 있음
};
export async function GET(_: NextRequest, context: Context) {
  const { id } = await context.params; // params를 비동기로 처리

  return withSessionUser(async () =>
    getSchedule(id) //
      .then((data) => NextResponse.json(data))
  );
}

export async function PATCH(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await req.json();

  return withSessionUser(async () => {
    // status만 업데이트하는 경우
    if (body.status && Object.keys(body).length === 1) {
      const result = await updateScheduleStatus(id, body.status);
      return NextResponse.json(result);
    } else {
      // 전체 스케줄 업데이트
      const result = await updateSchedule(id, body);
      return NextResponse.json(result);
    }
  });
}

export async function DELETE(_: NextRequest, context: Context) {
  const { id } = await context.params;

  return withSessionUser(async () => {
    // 1. 스케줄에 연결된 게임 결과가 있는지 확인
    const gameResultId = await getGameIdByScheduleId(id);
    if (gameResultId) {
      // 2. 게임 결과가 있으면 먼저 삭제
      await deleteGame(gameResultId);
    }
    // 3. 스케줄 삭제
    return deleteSchedule(id).then((data) => NextResponse.json(data));
  });
}
