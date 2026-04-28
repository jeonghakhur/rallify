import { createClub, getClubs } from '@/service/club';
import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return withSessionUser(async () => {
    const clubs = await getClubs();
    return NextResponse.json(clubs);
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withSessionUser(async (user) => {
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: '클럽 이름은 2자 이상이어야 합니다.' },
        { status: 400 }
      );
    }
    const club = await createClub(user.id, body);
    return NextResponse.json(club, { status: 201 });
  });
}
