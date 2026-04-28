import { joinClub } from '@/service/club';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Context = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  return withSessionUser(async (user) => {
    // 연락처 필수 체크
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phoneNumber: true },
    });
    if (!dbUser?.phoneNumber) {
      return NextResponse.json(
        {
          error:
            '클럽 가입에는 연락처 등록이 필요합니다. 프로필에서 연락처를 먼저 등록해주세요.',
        },
        { status: 400 }
      );
    }

    try {
      const member = await joinClub(id, user.id, body.introduction);
      return NextResponse.json(member, { status: 201 });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Unique constraint')) {
          return NextResponse.json(
            { error: '이미 가입 신청한 클럽입니다.' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(
        { error: '가입 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}
