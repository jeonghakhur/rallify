import { prisma } from '@/lib/prisma';

const gameResultInclude = {
  schedule: true,
  author: true,
  games: true,
  comments: {
    include: { author: true },
    orderBy: { createdAt: 'asc' as const },
  },
  editHistory: { include: { editor: true } },
} as const;

function formatGameResult(
  gr: Awaited<ReturnType<typeof prisma.gameResult.findFirst>> & {
    schedule?: {
      id: string;
      date: string;
      courtName: string;
      startTime: string;
      endTime: string;
      status: string;
      attendees?: unknown[];
      courtNumbers?: unknown[];
    } | null;
    author?: { name: string | null } | null;
    comments?: {
      id: string;
      text: string;
      createdAt: Date;
      authorId: string;
      author: {
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }[];
  }
) {
  if (!gr) return null;
  return {
    ...gr,
    scheduleID: gr.schedule?.id,
    date: gr.schedule?.date,
    courtName: gr.schedule?.courtName,
    startTime: gr.schedule?.startTime,
    endTime: gr.schedule?.endTime,
    scheduleStatus: gr.schedule?.status,
    author: { name: gr.author?.name },
    comments: (gr.comments ?? []).map((c) => ({
      _key: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      author: {
        _ref: c.authorId,
        name: c.author?.name ?? null,
        username: c.author?.username ?? null,
        image: c.author?.image ?? null,
      },
    })),
  };
}

export async function createGameResult(
  scheduleId: string,
  userId: string,
  matches: { court: string; players: string[]; score: string[]; time: string }[]
) {
  return prisma.gameResult.create({
    data: {
      scheduleId,
      authorId: userId,
      status: 'wait',
      games: {
        create: matches.map((m) => ({
          court: m.court,
          players: m.players,
          score: m.score,
          time: m.time,
        })),
      },
    },
    include: gameResultInclude,
  });
}

export async function updateGameResult(
  id: string,
  games: { court: string; players: string[]; score: string[]; time: string }[],
  status?: string,
  editorId?: string,
  scheduleId?: string
) {
  return prisma.$transaction(async (tx) => {
    // 기존 games 삭제 후 재생성
    await tx.game.deleteMany({ where: { gameResultId: id } });
    await tx.game.createMany({
      data: games.map((g) => ({ ...g, gameResultId: id })),
    });

    // 편집 이력 추가
    if (editorId) {
      await tx.editHistory.create({
        data: { gameResultId: id, editorId },
      });
    }

    // 스케줄 상태 업데이트
    if (status && scheduleId) {
      await tx.schedule.update({
        where: { id: scheduleId },
        data: { status },
      });
    }

    return tx.gameResult.update({
      where: { id },
      data: { lastEditedAt: new Date() },
      include: gameResultInclude,
    });
  });
}

export async function getAllGames(
  status?: string | null,
  startDate?: string | null,
  endDate?: string | null
) {
  const results = await prisma.gameResult.findMany({
    where: {
      schedule: {
        ...(status ? { status } : {}),
        ...(startDate && endDate
          ? { date: { gte: startDate, lte: endDate } }
          : {}),
      },
    },
    orderBy: { schedule: { date: 'desc' } },
    include: gameResultInclude,
  });
  return results.map(formatGameResult);
}

export async function getGame(scheduleId: string) {
  const gr = await prisma.gameResult.findUnique({
    where: { scheduleId },
    include: {
      ...gameResultInclude,
      schedule: {
        include: { attendees: true, courtNumbers: true },
      },
    },
  });
  if (!gr) return null;
  return {
    ...formatGameResult(gr as Parameters<typeof formatGameResult>[0]),
    attendees: gr.schedule?.attendees,
    courtNumbers: gr.schedule?.courtNumbers,
  };
}

export async function getGameById(gameId: string) {
  const gr = await prisma.gameResult.findUnique({
    where: { id: gameId },
    include: gameResultInclude,
  });
  return formatGameResult(gr as Parameters<typeof formatGameResult>[0]);
}

export async function hasGameResult(scheduleId: string) {
  const gr = await prisma.gameResult.findUnique({
    where: { scheduleId },
    select: { id: true },
  });
  return !!gr;
}

export async function getGameIdByScheduleId(scheduleId: string) {
  const gr = await prisma.gameResult.findUnique({
    where: { scheduleId },
    select: { id: true },
  });
  return gr?.id;
}

export async function deleteGame(id: string) {
  try {
    await prisma.gameResult.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

export async function addCommentToGameResult(
  gameResultId: string,
  comment: { authorId: string; text: string }
) {
  return prisma.gameComment.create({
    data: {
      gameResultId,
      authorId: comment.authorId,
      text: comment.text,
    },
    include: { author: true },
  });
}

export async function removeCommentFromGameResult(
  _gameResultId: string,
  commentKey: string
) {
  return prisma.gameComment.delete({ where: { id: commentKey } });
}

export async function getLatestGameByStatus(status?: string | null) {
  const gr = await prisma.gameResult.findFirst({
    where: status ? { schedule: { status } } : undefined,
    orderBy: { schedule: { date: 'desc' } },
    include: gameResultInclude,
  });
  return formatGameResult(gr as Parameters<typeof formatGameResult>[0]);
}
