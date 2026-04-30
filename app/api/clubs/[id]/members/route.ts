import { getClubMembers, getClubRole } from '@/service/club';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

const ALLOWED_STATUS = new Set([
  'PENDING',
  'INVITED',
  'ACTIVE',
  'REJECTED',
  'REMOVED',
  'LEFT',
]);

export async function GET(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const status =
    statusParam && ALLOWED_STATUS.has(statusParam) ? statusParam : undefined;

  return withSessionUser(async (user) => {
    const myRole = await getClubRole(id, user.id);
    if (
      myRole !== 'OWNER' &&
      myRole !== 'MANAGER' &&
      user.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const members = await getClubMembers(id, status, {
      includeSensitive: true,
    });
    return NextResponse.json(members);
  });
}
