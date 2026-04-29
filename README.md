# Rallify

테니스 클럽 스케줄링 및 게임 결과 관리 애플리케이션

## 기술 스택

- Next.js 15 (App Router)
- Prisma + PostgreSQL
- NextAuth v4 (Kakao / Naver / Google / Credentials)
- shadcn/ui + Tailwind CSS
- SWR

## 환경 변수

```bash
# .env.local
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# OAuth Providers
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 민감 정보 암호화 키
ENCRYPTION_KEY=your-encryption-key
```

## 설치 및 실행

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

개발 서버는 [http://localhost:3000](http://localhost:3000) 에서 실행됩니다.

## 주요 기능

- 클럽 관리 (생성, 가입, 멤버 관리)
- 테니스 스케줄 관리 (코트 예약, 참석자 관리)
- 게임 결과 기록 및 수정 이력
- 회원가입 / 관리자 승인 (역할 기반)
- 랭킹 및 기간별 통계
- 스케줄 / 게임 결과 댓글
