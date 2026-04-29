import { test, expect } from '@playwright/test';

// 테스트 계정 10개 생성
const TEST_ACCOUNTS = Array.from({ length: 10 }, (_, i) => ({
  email: `testuser${i + 1}_${Date.now()}@test.com`,
  password: 'Test12345pw',
  name: `테스트유저${i + 1}`,
  gender: i % 2 === 0 ? '남성' : '여성',
}));

const BASE_URL = 'http://localhost:3001';

test.describe('회원가입 및 로그인 테스트', () => {
  test.describe.configure({ mode: 'serial' });

  // 1. 회원가입 API 테스트 (10개 계정)
  test('10개 이메일 계정 회원가입 API', async ({ request }) => {
    const results: { email: string; status: number; success: boolean }[] = [];

    for (const account of TEST_ACCOUNTS) {
      const res = await request.post(`${BASE_URL}/api/auth/register`, {
        data: account,
      });
      await res.json().catch(() => ({}));
      results.push({
        email: account.email,
        status: res.status(),
        success: res.status() === 201,
      });
    }

    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`\n회원가입 결과: ${succeeded.length}/10 성공`);
    failed.forEach((r) => console.log(`  실패: ${r.email} (HTTP ${r.status})`));

    expect(succeeded.length).toBe(10);
  });

  // 2. 중복 이메일 가입 방지 확인
  test('중복 이메일 가입 시 400 반환', async ({ request }) => {
    const duplicate = TEST_ACCOUNTS[0];
    const res = await request.post(`${BASE_URL}/api/auth/register`, {
      data: duplicate,
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.error).toContain('이미 사용 중인 이메일');
  });

  // 3. 유효성 검사 확인
  test('패스워드 8자 미만 시 422 반환', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/register`, {
      data: {
        email: 'short@test.com',
        password: '123',
        name: '테스트',
        gender: '남성',
      },
    });
    expect(res.status()).toBe(422);
  });

  test('필수 항목 누락 시 422 반환', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/register`, {
      data: { email: 'nofill@test.com', password: 'Test12345pw' },
    });
    expect(res.status()).toBe(422);
  });

  // 4. UI 회원가입 플로우 (browser 테스트)
  test('이메일 가입 UI 플로우: 가입 → 로그인 화면(signup-complete 안내) 이동', async ({
    page,
  }) => {
    const account = {
      email: `ui_test_${Date.now()}@test.com`,
      password: 'Test12345pw',
      name: 'UI테스트',
      gender: '남성',
    };

    await page.goto(`${BASE_URL}/auth/signup`);
    await expect(page.getByText('이메일 회원가입')).toBeVisible();

    await page.fill('input[type="email"]', account.email);
    await page.fill('input[type="password"]', account.password);
    await page.fill('input[placeholder*="실명"]', account.name);
    await page.getByRole('button', { name: '남성' }).click();
    await page.getByRole('button', { name: '가입하기' }).click();

    // /auth/signin?notice=signup-complete 으로 이동 확인
    await expect(page).toHaveURL(/\/auth\/signin\?notice=signup-complete/, {
      timeout: 10000,
    });
    await expect(page.getByText('가입 신청이 접수되었습니다')).toBeVisible();
  });

  // 5. PENDING 사용자 로그인 차단 확인
  test('PENDING 계정 로그인 시 PENDING_APPROVAL 에러', async ({ page }) => {
    const account = TEST_ACCOUNTS[0];

    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[type="email"]', account.email);
    await page.fill('input[type="password"]', account.password);
    await page.getByRole('button', { name: /이메일로 로그인/ }).click();

    // 로그인 거절 → 에러 메시지 표시
    await expect(
      page.getByText(/가입 신청이 아직 승인되지 않았습니다/)
    ).toBeVisible({
      timeout: 10000,
    });
  });

  // 6. 로그인 페이지 UI 확인
  test('로그인 페이지에 "이메일로 가입하기" 링크 표시', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    const signupLink = page.getByRole('link', { name: '이메일로 가입하기' });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  // 7. 미로그인 사용자 접근 제어
  test('미로그인 / 접근 시 signin 리디렉션', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveURL(/\/(auth\/signin|\?callbackUrl)?/, {
      timeout: 5000,
    });
  });
});
