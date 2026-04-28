import { respondToInvitation } from '@/service/club';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string; memberId: string }> };

export async function POST(req: NextRequest, context: Context) {
  const { memberId } = await context.params;
  const body = await req.json();

  return withSessionUser(async (user) => {
    try {
      const result = await respondToInvitation(memberId, user.id, body.accept);
      return NextResponse.json(result ?? { success: true });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  });
}
