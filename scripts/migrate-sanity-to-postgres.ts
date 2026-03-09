/**
 * Sanity CMS → PostgreSQL 데이터 마이그레이션 스크립트
 *
 * 실행 방법:
 * DATABASE_URL="..." npx tsx scripts/migrate-sanity-to-postgres.ts
 *
 * 사전 조건:
 * - .env.local에 DATABASE_URL, DIRECT_URL 설정
 * - NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_SECRET_TOKEN 설정
 * - prisma migrate dev 실행 완료
 */

import { createClient } from '@sanity/client';
import { PrismaClient } from '@prisma/client';

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_SECRET_TOKEN,
  useCdn: false,
});

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('\n📦 1. 사용자 마이그레이션 시작...');
  const users = await sanity.fetch(
    `*[_type == "user"]{ _id, username, name, email, image, level, gender, provider, phone_number, birthday, birthyear, address }`
  );
  console.log(`   총 ${users.length}명 발견`);

  let success = 0;
  for (const u of users) {
    try {
      await prisma.user.upsert({
        where: { email: u.email ?? `unknown_${u._id}@migrate.local` },
        create: {
          id: u._id,
          username: u.username,
          name: u.name,
          email: u.email ?? `unknown_${u._id}@migrate.local`,
          image: u.image,
          level: u.level ?? 0,
          gender: u.gender,
          provider: u.provider,
          phoneNumber: u.phone_number,
          birthday: u.birthday,
          birthyear: u.birthyear,
          address: u.address,
        },
        update: {},
      });
      success++;
    } catch (err) {
      console.warn(`   ⚠️ 사용자 ${u._id} 실패:`, err);
    }
  }
  console.log(`   ✅ ${success}/${users.length} 완료`);
}

async function migrateSchedules() {
  console.log('\n📦 2. 스케줄 마이그레이션 시작...');
  const schedules =
    await sanity.fetch(`*[_type == "schedule"] | order(date asc) {
    _id, date, startTime, endTime, courtName, courtCount, status,
    "authorId": author._ref,
    courtNumbers[]{ number, startTime, endTime },
    attendees[]{ _key, name, gender, startHour, startMinute, endHour, endMinute, "userId": author._ref },
    comments[]{ _key, text, createdAt, "authorId": author._ref }
  }`);
  console.log(`   총 ${schedules.length}개 발견`);

  let success = 0;
  for (const s of schedules) {
    try {
      await prisma.schedule.upsert({
        where: { id: s._id },
        create: {
          id: s._id,
          date: s.date ?? '',
          startTime: s.startTime ?? '',
          endTime: s.endTime ?? '',
          courtName: s.courtName ?? '',
          courtCount: s.courtCount ?? '1',
          status: s.status ?? 'pending',
          authorId: s.authorId ?? undefined,
          courtNumbers: {
            create: (s.courtNumbers ?? []).map(
              (cn: { number: string; startTime: string; endTime: string }) => ({
                number: cn.number,
                startTime: cn.startTime,
                endTime: cn.endTime,
              })
            ),
          },
          attendees: {
            create: (s.attendees ?? []).map(
              (a: {
                _key: string;
                name: string;
                gender: string;
                startHour: string;
                startMinute: string;
                endHour: string;
                endMinute: string;
                userId?: string;
              }) => ({
                id: a._key,
                name: a.name ?? '',
                gender: a.gender ?? '',
                startHour: a.startHour ?? '',
                startMinute: a.startMinute ?? '',
                endHour: a.endHour ?? '',
                endMinute: a.endMinute ?? '',
                userId: a.userId ?? undefined,
              })
            ),
          },
        },
        update: {},
      });

      // 댓글 마이그레이션
      for (const c of s.comments ?? []) {
        if (!c.authorId) continue;
        await prisma.scheduleComment.upsert({
          where: { id: c._key },
          create: {
            id: c._key,
            scheduleId: s._id,
            authorId: c.authorId,
            text: c.text ?? '',
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          },
          update: {},
        });
      }

      success++;
    } catch (err) {
      console.warn(`   ⚠️ 스케줄 ${s._id} 실패:`, err);
    }
  }
  console.log(`   ✅ ${success}/${schedules.length} 완료`);
}

async function migrateGameResults() {
  console.log('\n📦 3. 게임 결과 마이그레이션 시작...');
  const games =
    await sanity.fetch(`*[_type == "gameResult"] | order(schedule->date asc) {
    _id, status, _createdAt,
    "scheduleId": schedule._ref,
    "authorId": author._ref,
    games[]{ court, players, score, time },
    comments[]{ _key, text, createdAt, "authorId": author._ref },
    editHistory[]{ _key, createdAt, "editorId": author._ref }
  }`);
  console.log(`   총 ${games.length}개 발견`);

  let success = 0;
  for (const g of games) {
    try {
      if (!g.scheduleId || !g.authorId) {
        console.warn(
          `   ⚠️ 게임 ${g._id}: scheduleId 또는 authorId 없음, 스킵`
        );
        continue;
      }

      await prisma.gameResult.upsert({
        where: { id: g._id },
        create: {
          id: g._id,
          scheduleId: g.scheduleId,
          authorId: g.authorId,
          status: g.status ?? 'pending',
          createdAt: g._createdAt ? new Date(g._createdAt) : new Date(),
          games: {
            create: (g.games ?? []).map(
              (game: {
                court: string;
                players: string[];
                score: string[];
                time: string;
              }) => ({
                court: game.court ?? '',
                players: game.players ?? [],
                score: game.score ?? [],
                time: game.time ?? '',
              })
            ),
          },
        },
        update: {},
      });

      // 댓글 마이그레이션
      for (const c of g.comments ?? []) {
        if (!c.authorId) continue;
        await prisma.gameComment.upsert({
          where: { id: c._key },
          create: {
            id: c._key,
            gameResultId: g._id,
            authorId: c.authorId,
            text: c.text ?? '',
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          },
          update: {},
        });
      }

      success++;
    } catch (err) {
      console.warn(`   ⚠️ 게임결과 ${g._id} 실패:`, err);
    }
  }
  console.log(`   ✅ ${success}/${games.length} 완료`);
}

async function verify() {
  console.log('\n🔍 검증...');
  const userCount = await prisma.user.count();
  const scheduleCount = await prisma.schedule.count();
  const gameCount = await prisma.gameResult.count();
  console.log(`   Users: ${userCount}`);
  console.log(`   Schedules: ${scheduleCount}`);
  console.log(`   GameResults: ${gameCount}`);
}

async function main() {
  console.log('🚀 Sanity → PostgreSQL 마이그레이션 시작');
  try {
    await migrateUsers();
    await migrateSchedules();
    await migrateGameResults();
    await verify();
    console.log('\n✅ 마이그레이션 완료!');
  } catch (err) {
    console.error('\n❌ 마이그레이션 실패:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
