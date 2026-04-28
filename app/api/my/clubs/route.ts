import { getMyClubs } from '@/service/club';
import { withSessionUser } from '@/util/session';
import { NextResponse } from 'next/server';

export async function GET() {
  return withSessionUser(async (user) => {
    const clubs = await getMyClubs(user.id);
    return NextResponse.json(clubs);
  });
}
