import { getUserByUser, updateUserById, deleteUserById } from '@/service/user';
import { withSessionUser } from '@/util/session';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function DELETE(req: NextRequest) {
  const body = await req.json();

  return withSessionUser(async (user) => {
    // 이메일 확인
    if (body.confirmEmail !== user.email) {
      return NextResponse.json(
        { error: '이메일이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 소유 클럽 확인
    const ownedClubs = await prisma.clubMember.findMany({
      where: { userId: user.id, role: 'OWNER', status: 'ACTIVE' },
      include: { club: { select: { id: true, name: true } } },
    });

    if (ownedClubs.length > 0) {
      return NextResponse.json(
        {
          error:
            '소유한 클럽이 있습니다. 클럽을 삭제하거나 소유권을 이전해주세요.',
          clubs: ownedClubs.map((m) => m.club),
        },
        { status: 400 }
      );
    }

    // ClubMember 상태 변경
    await prisma.clubMember.updateMany({
      where: { userId: user.id, status: 'ACTIVE' },
      data: { status: 'LEFT' },
    });

    // 유저 삭제 (CASCADE)
    await deleteUserById(user.id);

    return NextResponse.json({ success: true });
  });
}
