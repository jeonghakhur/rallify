# Plan: DB마이그레이션

> Sanity CMS → PostgreSQL (Supabase) + Prisma 마이그레이션

---

## 개요

| 항목 | 내용 |
|------|------|
| 기능명 | DB마이그레이션 |
| 목적 | Sanity CMS를 PostgreSQL + Prisma로 교체하여 멀티 클럽 지원 기반 마련 |
| 우선순위 | 높음 |
| 예상 규모 | 대형 (전체 데이터 레이어 교체) |
| 작성일 | 2026-03-09 |

---

## 배경 및 목적

### 현재 문제
- Sanity CMS는 콘텐츠 관리 목적의 도구로, 관계형 데이터(클럽-멤버-스케줄)에 부적합
- GROQ 쿼리 문자열이 타입 안전성 없이 하드코딩되어 있음
- 멀티 클럽 구조로 확장 시 권한 관리가 매우 복잡해짐
- 복잡한 트랜잭션 처리가 제한적

### 기대 효과
- Prisma로 TypeScript 타입 자동 생성 → 타입 안전성 대폭 향상
- PostgreSQL의 외래키, 트랜잭션으로 데이터 무결성 보장
- Row Level Security(RLS)로 클럽별 데이터 격리 용이
- 멀티 클럽 기능 구현 기반 확보

---

## 목표 기술 스택

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| DB | Sanity CMS | PostgreSQL (Supabase) |
| ORM | Sanity Client + GROQ | Prisma ORM |
| Auth DB | Sanity (user 스키마) | Prisma + NextAuth Prisma Adapter |
| 관리자 UI | Sanity Studio | Supabase Dashboard (또는 별도 구현) |
| 이미지 | Sanity Image | Supabase Storage 또는 외부 URL 유지 |

---

## 현재 데이터 모델

### Sanity 스키마 (현재)
```
user
├── username, name, email, image
├── level (권한 레벨)
├── gender, phone_number, birthday, birthyear, address
└── provider (kakao/naver)

schedule (courtSchedule)
├── author → reference(user)
├── date, startTime, endTime
├── courtName, courtCount
├── status (pending → done)
├── courtNumbers[] (object: number, startTime, endTime)
├── attendees[] (object: author→user, name, gender, startHour~endMinute)
└── comments[] (object: author→user, text, createdAt)

gameResult
├── schedule → reference(schedule)
├── author → reference(user)
├── games[] (object: court, players[], score[], time)
├── comments[] (object: author→user, text, createdAt)
├── status, editHistory[]
└── lastEditor, lastEditedAt

gameStatsPeriod
└── startDate, endDate
```

---

## 목표 데이터 모델 (Prisma)

```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  name         String
  email        String   @unique
  image        String?
  level        Int      @default(0)
  gender       String?
  provider     String?
  phoneNumber  String?
  birthday     String?
  birthyear    String?
  address      String?
  createdAt    DateTime @default(now())

  // 관계
  schedules    Schedule[]
  gameResults  GameResult[]
  clubMembers  ClubMember[]

  // NextAuth 필수
  accounts     Account[]
  sessions     Session[]
}

model Schedule {
  id          String   @id @default(cuid())
  date        String
  startTime   String
  endTime     String
  courtName   String
  courtCount  String
  status      String   @default("pending")
  createdAt   DateTime @default(now())

  // 관계
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  courtNumbers CourtNumber[]
  attendees   Attendee[]
  comments    ScheduleComment[]
  gameResult  GameResult?
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
  id          String   @id @default(cuid())
  name        String
  gender      String
  startHour   String
  startMinute String
  endHour     String
  endMinute   String
  scheduleId  String
  schedule    Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
}

model ScheduleComment {
  id         String   @id @default(cuid())
  text       String
  createdAt  DateTime @default(now())
  scheduleId String
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
}

model GameResult {
  id           String   @id @default(cuid())
  status       String   @default("pending")
  createdAt    DateTime @default(now())
  lastEditedAt DateTime?

  // 관계
  scheduleId   String   @unique
  schedule     Schedule @relation(fields: [scheduleId], references: [id])
  authorId     String
  author       User     @relation(fields: [authorId], references: [id])
  games        Game[]
  comments     GameComment[]
  editHistory  EditHistory[]
}

model Game {
  id           String     @id @default(cuid())
  court        String
  players      String[]
  score        String[]
  time         String
  gameResultId String
  gameResult   GameResult @relation(fields: [gameResultId], references: [id], onDelete: Cascade)
}

model GameComment {
  id           String     @id @default(cuid())
  text         String
  createdAt    DateTime   @default(now())
  gameResultId String
  gameResult   GameResult @relation(fields: [gameResultId], references: [id], onDelete: Cascade)
  authorId     String
  author       User       @relation(fields: [authorId], references: [id])
}

model EditHistory {
  id           String     @id @default(cuid())
  createdAt    DateTime   @default(now())
  gameResultId String
  gameResult   GameResult @relation(fields: [gameResultId], references: [id], onDelete: Cascade)
  editorId     String
  editor       User       @relation(fields: [editorId], references: [id])
}

model GameStatsPeriod {
  id        String   @id @default(cuid())
  startDate String
  endDate   String
  updatedAt DateTime @updatedAt
}

// NextAuth 필수 모델
model Account { ... }
model Session { ... }
model VerificationToken { ... }
```

---

## 구현 단계 (Phase)

### Phase 1: 환경 설정
- [ ] Supabase 프로젝트 생성
- [ ] Prisma 설치 및 초기 설정
- [ ] NextAuth Prisma Adapter 설정
- [ ] 환경변수 설정 (.env.local)

### Phase 2: Prisma 스키마 정의
- [ ] 기존 Sanity 스키마 분석 및 Prisma 스키마로 변환
- [ ] NextAuth 모델 추가
- [ ] 마이그레이션 실행 (`prisma migrate dev`)

### Phase 3: 서비스 레이어 교체
- [ ] `service/user.ts` - Sanity 클라이언트 → Prisma
- [ ] `service/schedule.ts` - GROQ 쿼리 → Prisma 쿼리
- [ ] `service/games.ts` - GROQ 쿼리 → Prisma 쿼리

### Phase 4: API 라우트 업데이트
- [ ] `/api/schedule/*` - Prisma 서비스 연동
- [ ] `/api/games/*` - Prisma 서비스 연동
- [ ] `/api/members/*` - Prisma 서비스 연동
- [ ] `/api/me/*` - Prisma 서비스 연동
- [ ] `/api/attendance/*` - Prisma 서비스 연동

### Phase 5: NextAuth 마이그레이션
- [ ] Sanity 어댑터 → Prisma 어댑터 교체
- [ ] 세션 콜백 유지 (level, gender 등)
- [ ] Kakao/Naver OAuth 유지

### Phase 6: 기존 데이터 마이그레이션
- [ ] Sanity → PostgreSQL 마이그레이션 스크립트 작성
- [ ] 데이터 검증

### Phase 7: 정리
- [ ] Sanity 관련 코드 제거 (`sanity/`, `sanity.config.ts` 등)
- [ ] `model/*.ts` 타입 파일 → Prisma 자동 생성 타입으로 교체
- [ ] console.log 정리

---

## 위험 요소

| 위험 | 대응 |
|------|------|
| 기존 데이터 손실 | 마이그레이션 전 Sanity 데이터 전체 백업 |
| OAuth 로그인 깨짐 | NextAuth 어댑터 교체 후 충분한 테스트 |
| 쿼리 로직 누락 | 서비스별 단위 테스트 작성 |
| Supabase 무료 제한 | 500MB DB, 1GB Storage (충분한 수준) |

---

## 완료 기준

- [ ] 기존 모든 기능이 PostgreSQL에서 동일하게 동작
- [ ] Kakao/Naver 로그인 정상 동작
- [ ] 스케줄 생성/수정/삭제 정상 동작
- [ ] 게임 결과 생성/수정/삭제 정상 동작
- [ ] 통계/랭킹 화면 정상 동작
- [ ] Sanity 관련 코드 완전 제거
