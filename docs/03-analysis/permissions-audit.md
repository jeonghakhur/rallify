# Permissions Audit — 권한 체계 현황 진단

> 작성일: 2026-05-06
> 작성자: claude
> 범위: 서버 API · 페이지 가드 · 인증 헬퍼 · 모델 정의

---

## 1. Executive Summary

권한 체계는 **plan에서 의도한 단일 `role` 기반 모델로 마이그레이션이 완료되지 않은 상태**이며, 그 결과 **다수의 핵심 API가 서버 측 권한 검사 없이 동작**하고 있습니다. 클라이언트 UI는 `level >= 3` 같은 숫자 비교로 버튼을 가리지만, 동일 동작의 API 라우트는 인증만(또는 인증조차 없이) 통과시킵니다.

| 발견 | 건수 | 최고 심각도 |
| ---- | :--: | :---------: |
| 서버 권한 우회 가능 (Critical) | **8개 라우트 변경 작업** + **7개 GET 무인증** | 🔴 Critical |
| 마이그레이션 미완 (level↔role 공존) | 8개 파일 | 🟠 High |
| 헬퍼·타입 비대칭 | 4건 | 🟡 Medium |
| 페이지 가드 일관성 | 1건 | 🟢 Low |

가장 시급한 것은 **§4의 서버 측 권한 가드 누락**이며, 이는 인증된 일반 회원이 운영진/관리자 전용 동작(스케줄 생성·삭제, 게임 결과 수정, 통계 기간 변경)을 임의 호출할 수 있는 상태입니다.

---

## 2. 권한 모델 (현재 코드 기준)

세 개의 권한 축이 공존합니다.

```
┌────────────────────────────────────────────────────────────┐
│ A. 글로벌 role     PENDING / USER / SUPER_ADMIN            │ User.role
├────────────────────────────────────────────────────────────┤
│ B. 레거시 level    0 / 1(일반) / 2(우수) / 3(운영진)        │ User.level   ← plan에선 폐기 예정이었으나 살아 있음
├────────────────────────────────────────────────────────────┤
│ C. 클럽 role       OWNER / MANAGER / MEMBER                 │ ClubMember.role
│ C. 클럽 status     PENDING/INVITED/ACTIVE/LEFT/REMOVED/REJECTED │ ClubMember.status
└────────────────────────────────────────────────────────────┘
```

### 문서 출처

| 문서 | 권한 관련 내용 |
| ---- | -------------- |
| [docs/archive/2026-04/클럽관리/클럽관리.plan.md](../archive/2026-04/%ED%81%B4%EB%9F%BD%EA%B4%80%EB%A6%AC/%ED%81%B4%EB%9F%BD%EA%B4%80%EB%A6%AC.plan.md) §2, FR-09 | 역할 체계 설계 + level→role 마이그레이션 매핑 + API/페이지 권한표 |
| [docs/archive/2026-04/클럽관리/클럽관리.report.md](../archive/2026-04/%ED%81%B4%EB%9F%BD%EA%B4%80%EB%A6%AC/%ED%81%B4%EB%9F%BD%EA%B4%80%EB%A6%AC.report.md) §2.1 | Before/After 매트릭스 |
| [docs/01-plan/features/club-join-application.plan.md](../01-plan/features/club-join-application.plan.md) §3, §8 | 클럽 가입 신청 권한 (FR-04 슈퍼관리자 통합 화면) |

> 별도의 통합 권한 정책 문서는 없으며, 위 PDCA 산출물에 분산 기술돼 있습니다.

---

## 3. 인프라 헬퍼 인벤토리

### 서버

| 헬퍼 | 위치 | 시그니처 | 비고 |
| ---- | ---- | -------- | ---- |
| `withSessionUser` | [util/session.ts](../../util/session.ts) | `(handler, { requiredRole?: 'SUPER_ADMIN' })` | 미인증/PENDING 401, SUPER_ADMIN 필요 시 403 |
| `getClubRole` | [service/club.ts:384](../../service/club.ts) | `(clubId, userId) → 'OWNER'\|'MANAGER'\|'MEMBER'\|null` | status=ACTIVE 만 |
| `isClubAdmin` | [service/club.ts:392](../../service/club.ts) | `(clubId, userId) → boolean` | OWNER \|\| MANAGER |

### 클라이언트

| 헬퍼 | 위치 | 비고 |
| ---- | ---- | ---- |
| `useAuthRedirect` | [hooks/useAuthRedirect.tsx](../../hooks/useAuthRedirect.tsx) | `(redirectTo, requiredRole?: 'SUPER_ADMIN')` |
| 직접 비교 | 컴포넌트 산재 | `user.role === 'SUPER_ADMIN'`, `user.level >= 3` 등 흩어짐 |

### 데이터·타입

- [model/user.ts](../../model/user.ts) `AuthUser.level: number` **필수** (role도 추가됐으나 level 그대로)
- [lib/userLevel.ts](../../lib/userLevel.ts) `USER_LEVELS = [{1: 일반회원}, {2: 우수회원}, {3: 운영진}]` — **레거시 level UI 라벨 사전**

---

## 4. API 권한 적용 현황 (Endpoint Inventory)

### 4.1 정상 — Role 가드 적용

| Path | Method | 가드 | 비고 |
| ---- | ------ | ---- | ---- |
| `/api/admin/members*` | GET·PATCH·DELETE | `user.role !== 'SUPER_ADMIN'` 인라인 | OK |
| `/api/admin/club-applications` | GET | `withSessionUser({ requiredRole: 'SUPER_ADMIN' })` | OK (이번 작업) |
| `/api/clubs/[id]` | PATCH | OWNER \|\| SUPER_ADMIN | OK |
| `/api/clubs/[id]` | DELETE | OWNER=소프트 / SUPER_ADMIN=하드 | OK |
| `/api/clubs/[id]/members*` | GET·PATCH·DELETE | OWNER\|MANAGER\|SUPER_ADMIN | OK (역할 변경은 OWNER+ SUPER만) |
| `/api/clubs/[id]/invite` | POST | isClubAdmin \|\| SUPER_ADMIN | OK |
| `/api/me` | GET·PATCH·DELETE | 본인 (DELETE는 이메일 재확인 + 소유 클럽 차단) | OK |
| `/api/clubs/[id]/join` | POST | 인증된 사용자 | OK (서비스 레이어에서 검증) |

### 4.2 🔴 Critical — Role/Level 가드 없음

`withSessionUser(handler)` 만 사용 → 인증된 모든 비-PENDING 사용자가 호출 가능. **클라이언트는 `level>=3` 가드를 두고 있는데 서버는 검사하지 않음**.

| Path | Method | 클라이언트 가드 | 서버 가드 | 영향 |
| ---- | ------ | --------------- | --------- | ---- |
| `/api/schedule` | POST | `level>=3` | **인증만** | 일반 회원이 임의 일정 생성 |
| `/api/schedule/[id]` | PATCH | `level>=3` | **인증만** | 일반 회원이 임의 일정 수정 |
| `/api/schedule/[id]` | DELETE | `level>=3` | **인증만** | 일반 회원이 일정+게임결과 함께 삭제 |
| `/api/games/[id]` | POST·PUT·DELETE | `level>=3` | **인증만** | 게임 결과 임의 수정/삭제 |
| `/api/match/[id]` | (수정류) | `level>=2` | **인증만** | 매치 데이터 임의 변경 |
| `/api/stats-period` | POST | (관리 화면 전용) | **인증만** | 통계 기간 임의 변경 |
| `/api/attendance` | POST·PATCH·DELETE | UI에서 분기 | **인증만** | 출결 임의 조작 |
| `/api/schedule/[id]/comments`, `/api/gameResult/[id]/comments` | DELETE | (작성자만) | **인증만** | **타인 댓글 삭제 가능** (작성자 검증 누락) |

### 4.3 🔴 Critical — 인증조차 없음 (Public Read)

`withSessionUser` 미사용 → **로그아웃 상태로도 호출 가능**.

| Path | Method | 반환 데이터 | 위험 |
| ---- | ------ | ----------- | ---- |
| `GET /api/schedule` | GET | 모든 스케줄 + 참석자 | 회원 이름·성별 노출 |
| `GET /api/schedule/[id]` | GET | 단건 + 참석자 | 동일 |
| `GET /api/games` | GET | 모든 게임 결과 | 회원 이름 노출 |
| `GET /api/games/latest` | GET | 최근 게임 | 동일 |
| `GET /api/match` | GET | 게임 결과 | 동일 |
| `GET /api/members` | GET | **전체 회원 목록** | 🚨 가장 민감 — 회원 명부 외부 노출 가능 (복호화는 안 되더라도 이름·이메일·level은 평문) |
| `GET /api/stats-period` | GET | 통계 기간 | 낮음 |

> 실제 노출 여부는 [service/user.ts](../../service/user.ts) `getAllMembers` 의 select 컬럼에 따라 다릅니다. 이메일·이름이 포함되면 즉시 차단 권장.

---

## 5. 페이지 가드 적용 현황

| Path | 가드 | 비고 |
| ---- | ---- | ---- |
| `/admin/members`, `/admin/club-applications` | `useAuthRedirect('/', 'SUPER_ADMIN')` | OK |
| `/clubs/[id]/manage` | `useAuthRedirect()` (인증만) + 본문에서 `isAdmin` 분기 | URL 직접 진입 가능 — "접근 권한이 없습니다" 텍스트만. API에서는 막힘 |
| `/schedule`, `/schedule/new`, `/schedule/[id]` | `useAuthRedirect()` 인증만 + `user.level >= 3` 인라인 분기 | UI는 가리지만 API 미보호와 결합되면 실효성 부족 |
| `/games`, `/games/[id]` | 동일 | 동일 |
| `/clubs`, `/my/clubs`, `/clubs/[id]` | 인증만 | OK (조회용) |

---

## 6. 모델·타입 일관성

| 항목 | 상태 |
| ---- | ---- |
| `User.role` (글로벌) | DB 스키마·세션·model/user.ts에 모두 존재 ✅ |
| `User.level` (레거시) | DB·세션·model/user.ts·스케줄·게임·관리화면에서 **여전히 사용** — plan에선 폐기 예정 ❌ |
| `AuthUser.level: number` | **필수 필드** — role-only 마이그레이션 미반영 |
| `level → role` 자동 동기화 | [api/admin/members/[id]:81-93](../../app/api/admin/members/[id]/route.ts) 에서 level 변경 시 role 매핑(0→PENDING, ≥4→SUPER_ADMIN). 단 **단방향**(role 직접 변경 시 level 그대로) |

---

## 7. 위험·이슈 (Severity별)

### 🔴 Critical — 보안

1. **C-1 운영자 권한 API 무가드**
   - `POST/PATCH/DELETE /api/schedule*`, `/api/games/[id]`, `/api/match/[id]`, `/api/stats-period`, `/api/attendance`
   - 일반 회원(USER 역할, level=1)이 운영진 동작을 임의 호출 가능
   - **테스트 재현**: 일반 회원 세션으로 `curl -X DELETE /api/schedule/<id>` → 200 OK 예상

2. **C-2 일부 GET 무인증**
   - `/api/members`, `/api/schedule`, `/api/games*`, `/api/match`, `/api/stats-period`
   - 비로그인 호출자에게 회원 명부·일정·게임 데이터가 그대로 응답될 가능성
   - 가장 시급한 건 `/api/members`

3. **C-3 댓글 삭제 작성자 미검증** (확정)
   - [`/api/schedule/[id]/comments`](../../app/api/schedule/[id]/comments/route.ts) DELETE: `withSessionUser(async () => removeCommentFromSchedule(id, commentKey))` — session user 정보를 받지조차 않음
   - [`/api/gameResult/[id]/comments`](../../app/api/gameResult/[id]/comments/route.ts) DELETE: 동일 패턴
   - **인증된 모든 사용자가 commentKey만 알면 타인 댓글 삭제 가능**. 서비스 레이어(`removeCommentFromSchedule`/`removeCommentFromGameResult`)에서 작성자 일치 검증 필요

### 🟠 High — 마이그레이션

4. **H-1 level↔role 공존**
   - plan: level 폐기, role-only로 통일
   - 현실: schedule/games 분기에 `level>=3` 직격, [lib/userLevel.ts](../../lib/userLevel.ts) UI 라벨, [model/user.ts](../../model/user.ts) AuthUser.level 필수
   - 결과: SUPER_ADMIN 외 “운영진” 역할이 코드에 의미를 갖지 못한 채 level 정수로만 표현됨 → 권한 의도가 코드만 봐서는 불명확

5. **H-2 role 변경 → level 미동기화**
   - admin이 role을 직접 바꾸는 UI는 없으나 DB 직접 수정 시 level이 stale → schedule/games 가드 결과가 두 축에서 달라짐

### 🟡 Medium — 헬퍼·타입

6. **M-1 `withSessionUser` 표현력 부족**
   - 옵션이 `requiredRole?: 'SUPER_ADMIN'` 단일 값. "USER 이상", "OWNER+ in club X" 같은 패턴은 인라인 분기로 흩어짐
   - 13개 라우트가 라우트마다 직접 비교 코드를 중복 작성

7. **M-2 `AuthUser.level` 필수**
   - role-only 라우트에서도 level이 타입 필드로 강제됨 — 잠재적 코드 정리 부채

### 🟢 Low — UX

8. **L-1 `/clubs/[id]/manage` 가드**
   - 비관리자도 진입 후 “접근 권한이 없습니다” 텍스트로 차단됨. URL 직접 입력 → 페이지 자체는 200. 데이터는 API에서 보호됨
   - UX 일관성 차원의 개선 (`useAuthRedirect`에 클럽 역할 옵션 추가 또는 페이지에서 isAdmin 미충족 시 redirect)

---

## 8. 우선순위 로드맵

### Phase 1 — Critical 차단 (보안)

1. `withSessionUser` 옵션 확장 — `requiredRole: 'SUPER_ADMIN' | 'USER'` (인증만은 default), 그리고 운영진 가드용 `requiredLevel?: number` 또는 명명된 권한(`STAFF`)
2. 운영자 동작 API에 가드 일괄 적용
   - `/api/schedule*` (POST/PATCH/DELETE)
   - `/api/games/[id]` (POST/PUT/DELETE)
   - `/api/match/[id]`, `/api/stats-period`, `/api/attendance` (mutation)
3. 무인증 GET에 인증 추가 또는 데이터 최소화
   - `/api/members` 즉시 인증 + 응답 필드 축소(이메일 제거 등)
   - `/api/schedule*`, `/api/games*`, `/api/match`, `/api/stats-period` 인증 추가
4. 댓글 DELETE에 작성자 일치 검사 추가 (`comment.authorId === user.id || isAdmin`)

### Phase 2 — 마이그레이션 정리

5. **권한 의미 결정**: "운영진" 역할을 (a) `User.role = 'STAFF'` 신설 / (b) 클럽 단위 MANAGER 로 흡수 / (c) level 유지 — 중 택일
6. 결정에 따라 schedule/games 가드 일괄 전환 (`level>=3` 제거)
7. `AuthUser.level` 옵셔널화 또는 제거, [lib/userLevel.ts](../../lib/userLevel.ts) 정리

### Phase 3 — 헬퍼·문서화

8. `lib/permissions.ts` (또는 `util/permissions.ts`) 도입 — 클라이언트/서버 공통 상수·타입가드(`isSuperAdmin`, `canManageSchedule` 등)
9. 권한 정책을 [docs/02-design/permissions.md](../02-design/permissions.md) 단일 문서로 추출 (현재는 PDCA 산출물에 분산)
10. `/clubs/[id]/manage` 가드 강화 (`useAuthRedirect`에 club role 옵션 또는 페이지 레벨 redirect)

---

## 9. 권장 즉시 액션

다음 한 가지만이라도 우선 처리하길 권합니다:

**`/api/members` GET에 인증 추가** — 1줄 변경, 회원 명부 외부 노출 차단.

```ts
// app/api/members/route.ts
import { withSessionUser } from '@/util/session';
export async function GET() {
  return withSessionUser(async () =>
    getAllMembers().then((data) => NextResponse.json(data))
  );
}
```

나머지 Phase 1 항목은 단일 PR로 묶어 진행 권장 (영향 범위가 라우트 8~10개로 한정되며 패턴이 동일).

---

## Version History

| 버전 | 날짜       | 변경 사항 | 작성자 |
| :--: | ---------- | --------- | ------ |
| 0.1  | 2026-05-06 | 초안 작성 | claude |
