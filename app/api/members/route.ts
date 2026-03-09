import { getAllMembers } from '@/service/user';
import { withSessionUser } from '@/util/session';
import { NextResponse } from 'next/server';

export async function GET() {
  return withSessionUser(async () =>
    getAllMembers().then((data) => NextResponse.json(data))
  );
}

// export async function POST(req: NextRequest) {
//   return withSessionUser(async (user) => {
//     const body = await req.json();
//     body.date = new Date(body.date);

//     const validatedData = ScheduleFormSchema.parse(body);

//     return createSchedule(user.id, validatedData).then((data) => NextResponse.json(data));
//   });
// }
