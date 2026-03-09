# Design: DB마이그레이션

> Sanity CMS → PostgreSQL (Supabase) + Prisma 상세 설계

---

## 아키텍처 변경 개요

```
[현재]
Next.js App → Sanity Client → Sanity CMS (Cloud)
                ↑ GROQ 쿼리 (문자열)

[변경 후]
Next.js App → Prisma Client → PostgreSQL (Supabase)
                ↑ TypeScript 타입 안전 쿼리
```

---

## 1. 패키지 설치

```bash
# Prisma ORM
npm install prisma @prisma/client

# NextAuth Prisma Adapter
npm install @auth/prisma-adapter

# Supabase (PostgreSQL 연결용 - 선택사항)
npm install @supabase/supabase-js
```

**제거할 패키지:**
```bash
npm uninstall sanity @sanity/client @sanity/image-url next-sanity
```

---

## 2. 환경변수 설계

### 추가 (.env.local)
```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# NextAuth (기존 유지)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
```

### 제거
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=...
NEXT_PUBLIC_SANITY_API_VERSION=...
SANITY_SECRET_TOKEN=...
```

---

## 3. Prisma 스키마 전체 설계

**파일 위치:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────
// NextAuth 필수 모델
// ─────────────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─────────────────────────────────────────
// 사용자
// ─────────────────────────────────────────

model User {
  id          String   @id @default(cuid())
  username    String?  @unique
  name        String?
  email       String?  @unique
  emailVerified DateTime?
  image       String?
  level       Int      @default(0)
  gender      String?
  provider    String?
  phoneNumber String?
  birthday    String?
  birthyear   String?
  address     String?
  createdAt   DateTime @default(now())

  // NextAuth 관계
  accounts    Account[]
  sessions    Session[]

  // 앱 관계
  schedules         Schedule[]        @relation("ScheduleAuthor")
  attendees         Attendee[]
  scheduleComments  ScheduleComment[]
  gameResults       GameResult[]      @relation("GameResultAuthor")
  gameComments      GameComment[]
  editHistories     EditHistory[]
}

// ─────────────────────────────────────────
// 스케줄
// ─────────────────────────────────────────

model Schedule {
  id         String   @id @default(cuid())
  date       String
  startTime  String
  endTime    String
  courtName  String
  courtCount String
  status     String   @default("pending")
  createdAt  DateTime @default(now())

  authorId     String
  author       User             @relation("ScheduleAuthor", fields: [authorId], references: [id])
  courtNumbers CourtNumber[]
  attendees    Attendee[]
  comments     ScheduleComment[]
  gameResult   GameResult?
}

model CourtNumber {
  id         String   @id @default(cuid())
  number     String
  startTime  String
  endTime    String

  scheduleId String
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
}

model Attendee {
  id          String  @id @default(cuid())
  name        String
  gender      String
  startHour   String
  startMinute String
  endHour     String
  endMinute   String

  scheduleId String
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
}

model ScheduleComment {
  id        String   @id @default(cuid())
  text      String
  createdAt DateTime @default(now())

  scheduleId String
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
}

// ─────────────────────────────────────────
// 게임 결과
// ─────────────────────────────────────────

model GameResult {
  id           String    @id @default(cuid())
  status       String    @default("pending")
  createdAt    DateTime  @default(now())
  lastEditedAt DateTime?

  scheduleId  String     @unique
  schedule    Schedule   @relation(fields: [scheduleId], references: [id])
  authorId    String
  author      User       @relation("GameResultAuthor", fields: [authorId], references: [id])
  games       Game[]
  comments    GameComment[]
  editHistory EditHistory[]
}

model Game {
  id      String   @id @default(cuid())
  court   String
  players String[]
  score   String[]
  time    String

  gameResultId String
  gameResult   GameResult @relation(fields: [gameResultId], references: [id], onDelete: Cascade)
}

model GameComment {
  id        String   @id @default(cuid())
  text      String
  createdAt DateTime @default(now())

  gameResultId String
  gameResult   GameResult @relation(fields: [gameResultId], references: [id], onDelete: Cascade)
  authorId     String
  author       User       @relation(fields: [authorId], references: [id])
}

model EditHistory {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  gameResultId String
  gameResult   GameResult @relation(fields: [gameResultId], references: [id], onDelete: Cascade)
  editorId     String
  editor       User       @relation(fields: [editorId], references: [id])
}

// ─────────────────────────────────────────
// 통계 설정
// ─────────────────────────────────────────

model GameStatsPeriod {
  id        String   @id @default(cuid())
  startDate String
  endDate   String
  updatedAt DateTime @updatedAt
}
```

---

## 4. Prisma Client 설정

**파일 위치:** `lib/prisma.ts` (신규 생성)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 5. NextAuth 어댑터 변경

**파일 위치:** `pages/api/auth/[...nextauth].js`

```typescript
// 현재 (Sanity 어댑터)
import { addUser, existingUser } from '@/service/user'

// 변경 후 (Prisma 어댑터)
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({ ... }),
    NaverProvider({ ... }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Prisma에서 user 추가 정보 조회
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { level: true, gender: true, username: true }
      })
      session.user.id = user.id
      session.user.level = dbUser?.level ?? 0
      session.user.gender = dbUser?.gender ?? ''
      session.user.userName = dbUser?.username ?? ''
      return session
    }
  }
}
```

---

## 6. 서비스 레이어 변환 설계

### 6-1. service/user.ts 변환

| 현재 함수 | Prisma 변환 |
|-----------|------------|
| `existingUser(email)` | `prisma.user.findUnique({ where: { email } })` |
| `addUser(userProps)` | `prisma.user.upsert({ where: { email }, create: ..., update: {} })` |
| `getAllMembers()` | `prisma.user.findMany({ where: { level: { gte: 1 } } })` |
| `getUserByUser(id)` | `prisma.user.findUnique({ where: { id } })` |
| `updateUserById(id, data)` | `prisma.user.update({ where: { id }, data })` |
| `searchUsers(keyword)` | `prisma.user.findMany({ where: { name: { contains: keyword } } })` |

### 6-2. service/schedule.ts 변환

| 현재 함수 | Prisma 변환 |
|-----------|------------|
| `getSchedule(id)` | `prisma.schedule.findUnique({ where: { id }, include: { ... } })` |
| `getAllSchedule()` | `prisma.schedule.findMany({ include: { gameResult: true, ... }, orderBy: { date: 'desc' } })` |
| `createSchedule(userId, data)` | `prisma.schedule.create({ data: { authorId: userId, ... } })` |
| `updateSchedule(id, data)` | `prisma.schedule.update({ where: { id }, data })` |
| `deleteSchedule(id)` | `prisma.schedule.delete({ where: { id } })` |
| `addAttendance(scheduleId, data)` | `prisma.attendee.create({ data: { scheduleId, ... } })` |
| `updateAttendance(scheduleId, data)` | `prisma.attendee.update({ where: { id: data._key }, data })` |
| `removeAttendance(scheduleId, key)` | `prisma.attendee.delete({ where: { id: key } })` |

### 6-3. service/games.ts 변환

| 현재 함수 | Prisma 변환 |
|-----------|------------|
| `createGameResult(scheduleId, userId, matches)` | `prisma.gameResult.create({ data: { scheduleId, authorId: userId, games: { create: matches } } })` |
| `updateGameResult(id, games)` | `prisma.$transaction([delete old games, create new games, update gameResult])` |
| `getAllGames(status, startDate, endDate)` | `prisma.gameResult.findMany({ where: { schedule: { status, date: { gte, lte } } }, include: ... })` |
| `getGameById(gameId)` | `prisma.gameResult.findUnique({ where: { id: gameId }, include: ... })` |
| `deleteGame(id)` | `prisma.gameResult.delete({ where: { id } })` |
| `addCommentToGameResult(gameId, comment)` | `prisma.gameComment.create({ data: { gameResultId: gameId, ... } })` |
| `removeCommentFromGameResult(gameId, key)` | `prisma.gameComment.delete({ where: { id: key } })` |

---

## 7. 파일 변경 목록

### 신규 생성
```
prisma/
  schema.prisma           # Prisma 스키마
  migrations/             # 자동 생성됨
lib/
  prisma.ts               # Prisma 클라이언트 싱글턴
```

### 수정
```
pages/api/auth/[...nextauth].js   # Prisma Adapter로 교체
service/user.ts                    # GROQ → Prisma
service/schedule.ts                # GROQ → Prisma
service/games.ts                   # GROQ → Prisma
model/user.ts                      # Prisma 타입으로 교체
model/schedule.ts                  # Prisma 타입으로 교체 (Zod 스키마는 유지)
model/gameResult.ts                # Prisma 타입으로 교체
package.json                       # 의존성 변경
.env.local                         # 환경변수 변경
next.config.ts                     # Sanity 이미지 도메인 설정 제거
```

### 삭제
```
sanity/                   # Sanity 전체 폴더
sanity.config.ts
sanity.cli.ts
```

---

## 8. 데이터 마이그레이션 스크립트 설계

**파일 위치:** `scripts/migrate-sanity-to-postgres.ts`

```
실행 순서:
1. Sanity에서 전체 user 데이터 조회
2. PostgreSQL user 테이블에 upsert
3. Sanity에서 전체 schedule 데이터 조회
4. PostgreSQL schedule + courtNumbers + attendees + comments 생성
5. Sanity에서 전체 gameResult 데이터 조회
6. PostgreSQL gameResult + games + comments + editHistory 생성
7. 데이터 수 검증 (Sanity count == PostgreSQL count)
```

---

## 9. 구현 순서 (Do Phase)

```
Step 1: 패키지 설치 및 환경변수 설정
Step 2: prisma/schema.prisma 작성
Step 3: Supabase 프로젝트 생성 & DB 연결 확인
Step 4: prisma migrate dev 실행
Step 5: lib/prisma.ts 생성
Step 6: NextAuth Prisma Adapter 적용
Step 7: service/user.ts 교체
Step 8: service/schedule.ts 교체
Step 9: service/games.ts 교체
Step 10: API 라우트 동작 확인
Step 11: 데이터 마이그레이션 스크립트 실행
Step 12: Sanity 코드 제거
```

---

## 10. 완료 기준

- [ ] `prisma migrate dev` 성공
- [ ] NextAuth 로그인 (Kakao/Naver) 정상 동작
- [ ] 스케줄 CRUD 전체 동작
- [ ] 게임 결과 CRUD 전체 동작
- [ ] 참석자 추가/수정/삭제 동작
- [ ] 댓글 추가/삭제 동작
- [ ] 홈 대시보드 (통계/랭킹) 정상 표시
- [ ] Sanity 관련 import 완전 제거
- [ ] TypeScript 빌드 오류 없음 (`npm run build`)
