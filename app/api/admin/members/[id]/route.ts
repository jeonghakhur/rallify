import { updateUserById, deleteUserById } from '@/service/user';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Context) {
  const { id } = await context.params;
  const body = await req.json();

  return withSessionUser(async (user) => {
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    const result = await updateUserById(id, { level: body.level });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeResult } = result as typeof result & {
      password?: string;
    };
    return NextResponse.json(safeResult);
  });
}

export async function DELETE(_: NextRequest, context: Context) {
  const { id } = await context.params;

  return withSessionUser(async (user) => {
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }
    await deleteUserById(id);
    return NextResponse.json({ success: true });
  });
}
