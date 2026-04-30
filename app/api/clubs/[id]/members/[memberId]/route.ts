import {
  approveMember,
  rejectMember,
  removeMember,
  leaveClub,
  updateMemberRole,
  getClubRole,
  purgeMember,
} from '@/service/club';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PURGEABLE_STATUSES = new Set(['REJECTED', 'LEFT', 'REMOVED']);

type Context = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(req: NextRequest, context: Context) {
  const { id, memberId } = await context.params;
  const body = await req.json();

  return withSessionUser(async (user) => {
    const myRole = await getClubRole(id, user.id);
    if (
      myRole !== 'OWNER' &&
      myRole !== 'MANAGER' &&
      user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    try {
      // 역할 변경
      if (body.role) {
        if (myRole !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
          return NextResponse.json(
            { error: '역할 변경은 클럽 소유자만 가능합니다.' },
            { status: 403 }
          );
        }
        const result = await updateMemberRole(memberId, body.role);
        return NextResponse.json(result);
      }

      // 상태 변경 (승인/거절)
      if (body.status === 'ACTIVE') {
        const result = await approveMember(memberId);
        return NextResponse.json(result);
      }
      if (body.status === 'REJECTED') {
        const result = await rejectMember(memberId, body.statusReason);
        return NextResponse.json(result);
      }

      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  });
}

export async function DELETE(req: NextRequest, context: Context) {
  const { id, memberId } = await context.params;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get('permanent') === '1';
  const body = await req.json().catch(() => ({}));

  return withSessionUser(async (user) => {
    const targetMember = await prisma.clubMember.findUnique({
      where: { id: memberId },
    });
    if (!targetMember) {
      return NextResponse.json(
        { error: '멤버를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    try {
      // 영구 삭제: REJECTED/LEFT/REMOVED 만, OWNER 또는 SUPER_ADMIN
      if (permanent) {
        const myRole = await getClubRole(id, user.id);
        if (myRole !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
          return NextResponse.json(
            { error: '권한이 없습니다.' },
            { status: 403 }
          );
        }
        if (!PURGEABLE_STATUSES.has(targetMember.status)) {
          return NextResponse.json(
            {
              error:
                '비활성 상태(거절/탈퇴/강퇴)의 멤버만 영구 삭제할 수 있습니다.',
            },
            { status: 400 }
          );
        }
        await purgeMember(memberId);
        return NextResponse.json({ success: true });
      }

      // 본인 탈퇴
      if (targetMember.userId === user.id) {
        await leaveClub(memberId, user.id);
        return NextResponse.json({ success: true });
      }

      // 강퇴 (OWNER만)
      const myRole = await getClubRole(id, user.id);
      if (myRole !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: '강퇴 권한이 없습니다.' },
          { status: 403 }
        );
      }

      await removeMember(memberId, body.reason);
      return NextResponse.json({ success: true });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  });
}
