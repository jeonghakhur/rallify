import { inviteMember, isClubAdmin } from '@/service/club';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Context = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await req.json();

  return withSessionUser(async (user) => {
    if (!(await isClubAdmin(id, user.id)) && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    if (!body.userId) {
      return NextResponse.json(
        { error: '초대할 사용자를 선택해주세요.' },
        { status: 400 }
      );
    }

    // 대상 사용자 존재 확인
    const target = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!target) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    try {
      const member = await inviteMember(id, body.userId, user.id, body.role);
      return NextResponse.json(member, { status: 201 });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        return NextResponse.json(
          { error: '이미 클럽 멤버이거나 초대된 사용자입니다.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: '초대 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}
