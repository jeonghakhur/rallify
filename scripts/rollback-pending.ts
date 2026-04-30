/**
 * 일회성 스크립트: 특정 클럽의 PENDING 가입 신청 레코드 삭제
 *
 * 실행: npx tsx scripts/rollback-pending.ts "그랜드슬램"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const keyword = process.argv[2] ?? '그랜드슬램';

  const clubs = await prisma.club.findMany({
    where: { name: { contains: keyword } },
    select: { id: true, name: true },
  });

  if (clubs.length === 0) {
    console.log(`[그랜드슬램 검색] "${keyword}" 포함 클럽 없음.`);
    return;
  }

  for (const club of clubs) {
    const pending = await prisma.clubMember.findMany({
      where: { clubId: club.id, status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    console.log(`\n클럽: ${club.name} (${club.id})`);
    console.log(`PENDING 신청 ${pending.length}건:`);
    pending.forEach((m) => {
      console.log(
        `  - memberId=${m.id}, user=${m.user.name ?? '-'} (${m.user.email ?? '-'}), createdAt=${m.createdAt.toISOString()}`
      );
    });

    if (pending.length === 0) continue;

    const result = await prisma.clubMember.deleteMany({
      where: { clubId: club.id, status: 'PENDING' },
    });
    console.log(`→ 삭제 완료: ${result.count}건`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
