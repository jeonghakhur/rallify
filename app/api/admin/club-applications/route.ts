import { prisma } from '@/lib/prisma';
import { decryptField } from '@/util/encryption';
import { withSessionUser } from '@/util/session';
import { NextResponse } from 'next/server';

export async function GET() {
  return withSessionUser(
    async () => {
      const applications = await prisma.clubMember.findMany({
        where: { status: 'PENDING' },
        include: {
          club: { select: { id: true, name: true, joinType: true } },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              gender: true,
              phoneNumber: true,
              birthyear: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const data = applications.map((m) => ({
        memberId: m.id,
        clubId: m.clubId,
        clubName: m.club.name,
        clubJoinType: m.club.joinType,
        introduction: m.introduction,
        createdAt: m.createdAt,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          gender: m.user.gender,
          phoneNumber: decryptField(m.user.phoneNumber),
          birthyear: decryptField(m.user.birthyear),
        },
      }));

      return NextResponse.json(data);
    },
    { requiredRole: 'SUPER_ADMIN' }
  );
}
