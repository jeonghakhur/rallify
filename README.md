# React Tennis V2

테니스 스케줄링 및 게임 결과 관리 애플리케이션

## 개발 환경 설정

### Mock 데이터 사용하기

개발 시 실제 Sanity 데이터 대신 Mock 데이터를 사용하려면:

1. **환경별 데이터셋 사용 (권장)**
   ```bash
   # .env.local 파일에 추가
   NEXT_PUBLIC_SANITY_DATASET_DEV=development
   ```
   
   이렇게 하면 개발 모드에서는 `development` 데이터셋을, 프로덕션에서는 `production` 데이터셋을 사용합니다.

2. **Sanity Studio에서 개발용 데이터셋 생성**
   - Sanity Studio에서 `development` 데이터셋을 생성
   - 프로덕션 데이터를 복사하여 개발용 데이터셋에 저장
   - 개발 중에는 이 데이터셋을 사용하여 실제 데이터에 영향을 주지 않음

### 환경 변수 설정

```bash
# .env.local 파일 생성
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_DATASET_DEV=development
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-22
SANITY_SECRET_TOKEN=your-secret-token
```

## 설치 및 실행

```bash
npm install
npm run dev
```

## 주요 기능

- 테니스 스케줄 관리
- 게임 결과 기록
- 사용자 인증 및 권한 관리
- 실시간 데이터 업데이트

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
