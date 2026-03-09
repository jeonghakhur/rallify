import { getUserByUser, updateUserById } from '@/service/user';
import { withSessionUser } from '@/util/session';

import { NextRequest, NextResponse } from 'next/server';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: Context) {
  const { id } = await context.params;

  return withSessionUser(async () =>
    getUserByUser(id).then((data) => NextResponse.json(data))
  );
}

export async function PATCH(req: NextRequest, context: Context) {
  const { id } = await context.params;
  console.log(id);
  const body = await req.json();
  console.log(body);

  return withSessionUser(async () =>
    updateUserById(id, body).then((data) => {
      return NextResponse.json(data);
    })
  );
}
