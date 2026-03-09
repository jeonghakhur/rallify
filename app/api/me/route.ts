import { getUserByUser, updateUserById } from '@/service/user';
import { withSessionUser } from '@/util/session';
import { NextResponse, NextRequest } from 'next/server';

export async function GET() {
  return withSessionUser(async (user) =>
    getUserByUser(user.id).then((data) => NextResponse.json(data))
  );
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  return withSessionUser(async (user) =>
    updateUserById(user.id, body).then((data) => {
      return NextResponse.json(data);
    })
  );
}

// export async function DELETE(_: NextRequest, context: Context) {
//   const { id } = await context.params;

//   return withSessionUser(async () =>
//     deleteSchedule(id).then((data) => NextResponse.json(data))
//   );
// }
