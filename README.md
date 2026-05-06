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
DIRECT_URL=postgresql://...   # Supabase pooler 사용 시 마이그레이션용

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

# 민감 정보 암호화 키 (AES-256-GCM, 64 hex)
ENCRYPTION_KEY=your-encryption-key

# 메일 발송 (Resend)
RESEND_API_KEY=
MAIL_FROM=Rallify <noreply@example.com>
```

## 설치 및 실행

```bash
yarn install
npx prisma generate
npx prisma migrate deploy
yarn dev
```

개발 서버는 [http://localhost:3000](http://localhost:3000) 에서 실행됩니다.

## 주요 기능

- 클럽 관리 (생성, 가입 신청/승인/거절, 역할별 멤버 관리)
- 슈퍼관리자 회원 승인 / 클럽 신청 통합 모니터링
- 테니스 스케줄 관리 (코트 예약, 참석자 관리)
- 게임 결과 기록 및 수정 이력
- 이메일 회원가입 + 소셜 로그인(Kakao/Naver/Google)
- 가입 안내 메일 자동 발송 (Resend)
- 민감 정보(연락처/생년월일) 암호화 저장
- 랭킹 및 기간별 통계
- 스케줄 / 게임 결과 댓글
