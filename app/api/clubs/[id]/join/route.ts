import { joinClub } from '@/service/club';
import { updateUserById } from '@/service/user';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Context = { params: Promise<{ id: string }> };

const INTRO_MIN = 10;
const INTRO_MAX = 500;

export async function POST(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    introduction?: string;
    phoneNumber?: string;
    gender?: string;
    birthyear?: string;
  };

  return withSessionUser(async (user) => {
    const introduction = (body.introduction ?? '').trim();
    if (introduction.length < INTRO_MIN || introduction.length > INTRO_MAX) {
      return NextResponse.json(
        {
          error: `자기소개는 ${INTRO_MIN}~${INTRO_MAX}자 사이로 입력해주세요.`,
        },
        { status: 400 }
      );
    }

    // 프로필 필드: 입력값이 있으면 갱신
    const profileUpdate: Parameters<typeof updateUserById>[1] = {};
    if (body.phoneNumber !== undefined) {
      const phone = body.phoneNumber.trim();
      if (phone) profileUpdate.phoneNumber = phone;
    }
    if (body.gender !== undefined) {
      const g = body.gender.trim();
      if (g) profileUpdate.gender = g;
    }
    if (body.birthyear !== undefined) {
      const by = body.birthyear.trim();
      if (by) profileUpdate.birthyear = by;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await updateUserById(user.id, profileUpdate);
    }

    // 갱신 후 필수 항목 재검증
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phoneNumber: true, gender: true, birthyear: true },
    });
    const missing: string[] = [];
    if (!dbUser?.phoneNumber) missing.push('phoneNumber');
    if (!dbUser?.gender) missing.push('gender');
    if (!dbUser?.birthyear) missing.push('birthyear');

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: '연락처/성별/출생년도는 필수입니다.',
          missingFields: missing,
        },
        { status: 400 }
      );
    }

    try {
      const member = await joinClub(id, user.id, introduction);
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
