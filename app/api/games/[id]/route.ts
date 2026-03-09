import {
  createGameResult,
  deleteGame,
  getGame,
  getGameById,
  updateGameResult,
} from '@/service/games';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return await withSessionUser(async (user) => {
    const { scheduleId, matches } = await req.json();

    const game = await getGame(scheduleId);

    if (game) {
      return updateGameResult(game._id, matches, undefined, {
        _ref: user.id,
        name: user.name,
        username: user.userName,
        image: user.image,
      }).then((data) => NextResponse.json(data));
    } else {
      return createGameResult(scheduleId, user.id, matches).then((data) =>
        NextResponse.json(data)
      );
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

export async function PUT(req: NextRequest, context: Context) {
  const { id } = await context.params;

  return await withSessionUser(async (user) => {
    const { matches, status } = await req.json();

    // 게임 ID로 직접 게임을 찾아서 업데이트
    const game = await getGameById(id);
    console.log(status);

    if (game) {
      return updateGameResult(
        id,
        matches,
        status,
        user.id,
        game.scheduleID
      ).then((data) => NextResponse.json(data));
    } else {
      return NextResponse.json(
        { error: '게임을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
  });
}

export async function DELETE(_: NextRequest, context: Context) {
  const { id } = await context.params;

  return withSessionUser(async () =>
    deleteGame(id).then((data) => NextResponse.json(data))
  );
}
