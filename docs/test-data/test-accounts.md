# 테스트 계정 목록

> 생성일: 2026-03-10
> 용도: 회원가입/로그인 기능 테스트
> 패스워드 (공통): `Test12345pw`
> 상태: 모두 `level=0` (관리자 승인 대기)

---

## 이메일 테스트 계정 (Playwright 자동 생성)

| # | 이름 | 이메일 | 성별 | 상태 | DB ID |
|---|------|--------|------|------|-------|
| 1 | 테스트유저1 | testuser1_1773116234062@test.com | 남성 | level=0 | cmmk3misv0001hh94qpx0rwom |
| 2 | 테스트유저2 | testuser2_1773116234062@test.com | 여성 | level=0 | cmmk3mjek0002hh9465b6ce1b |
| 3 | 테스트유저3 | testuser3_1773116234062@test.com | 남성 | level=0 | cmmk3mjzg0003hh94qm7yjl6k |
| 4 | 테스트유저4 | testuser4_1773116234062@test.com | 여성 | level=0 | cmmk3mkjk0004hh94tc7i2lr8 |
| 5 | 테스트유저5 | testuser5_1773116234062@test.com | 남성 | level=0 | cmmk3ml3r0005hh94uyt75iig |
| 6 | 테스트유저6 | testuser6_1773116234062@test.com | 여성 | level=0 | cmmk3mlor0006hh94n851k4qj |
| 7 | 테스트유저7 | testuser7_1773116234062@test.com | 남성 | level=0 | cmmk3mmb70007hh94ry3q40zy |
| 8 | 테스트유저8 | testuser8_1773116234062@test.com | 여성 | level=0 | cmmk3mmyu0008hh94huiqz4i5 |
| 9 | 테스트유저9 | testuser9_1773116234062@test.com | 남성 | level=0 | cmmk3mnnf0009hh941t41lrn2 |
| 10 | 테스트유저10 | testuser10_1773116234062@test.com | 여성 | level=0 | cmmk3mo7u000ahh94bmr39hzf |

## 기타 테스트 계정

| 이름 | 이메일 | 성별 | 용도 | DB ID |
|------|--------|------|------|-------|
| UI테스트 | ui_test_1773116243830@test.com | 남성 | UI 플로우 테스트 | cmmk3mtps000bhh94cn29hsb7 |
| 디버그 | debug3@test.com | 남성 | API 응답 확인용 | cmmk3m0jn0000hh94q86bycgw |

---

## 관리자 승인 방법

```bash
# 특정 계정 승인 (level=0 → level=1)
curl -X PATCH http://localhost:3001/api/admin/members/{id} \
  -H "Content-Type: application/json" \
  -d '{"level": 1}'
```

또는 `/admin/members` 페이지(level 4 이상 계정으로 접속)에서 승인 버튼 클릭.

---

## 테스트 시나리오별 추천 계정

| 시나리오 | 추천 계정 |
|---------|-----------|
| 이메일 로그인 테스트 | testuser1 ~ testuser10 (패스워드: `Test12345pw`) |
| 승인 대기 화면 확인 | 아무 계정 (모두 level=0) |
| 승인 후 정상 접근 테스트 | testuser1을 `/admin/members`에서 승인 후 사용 |
| 중복 가입 방지 테스트 | testuser1 이메일로 재가입 시도 |
