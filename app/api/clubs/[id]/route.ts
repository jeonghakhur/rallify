import {
  getClubById,
  updateClub,
  softDeleteClub,
  hardDeleteClub,
  reactivateClub,
  getClubRole,
} from '@/service/club';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Context) {
  const { id } = await context.params;
  return withSessionUser(async (user) => {
    const club = await getClubById(id, user.id);
    if (!club)
      return NextResponse.json(
        { error: '클럽을 찾을 수 없습니다.' },
        { status: 404 }
      );
    return NextResponse.json(club);
  });
}

export async function PATCH(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await req.json();

  return withSessionUser(async (user) => {
    const role = await getClubRole(id, user.id);
    if (role !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // reactivate 처리
    if (body.reactivate === true) {
      const club = await reactivateClub(id);
      return NextResponse.json(club);
    }

    const club = await updateClub(id, body);
    return NextResponse.json(club);
  });
}

export async function DELETE(_: NextRequest, context: Context) {
  const { id } = await context.params;

  return withSessionUser(async (user) => {
    const role = await getClubRole(id, user.id);

    // SUPER_ADMIN: 영구 삭제
    if (user.role === 'SUPER_ADMIN') {
      await hardDeleteClub(id);
      return NextResponse.json({ success: true });
    }

    // OWNER: 소프트 삭제
    if (role !== 'OWNER') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    await softDeleteClub(id);
    return NextResponse.json({ success: true });
  });
}
