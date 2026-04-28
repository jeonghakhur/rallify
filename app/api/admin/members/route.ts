import { getAllMembers, getPendingMembers } from '@/service/user';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return withSessionUser(async (user) => {
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    if (status === 'pending') {
      const data = await getPendingMembers();
      return NextResponse.json(data);
    }
    const data = await getAllMembers();
    return NextResponse.json(data);
  });
}
