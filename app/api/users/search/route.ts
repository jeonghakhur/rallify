import { withSessionUser } from '@/util/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');

  return withSessionUser(async () => {
    if (!q || q.trim().length < 2) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        role: { not: 'PENDING' },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, username: true, image: true },
      take: 20,
    });

    return NextResponse.json(users);
  });
}
