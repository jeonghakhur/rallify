# Plan: 클럽 가입 신청 정보 (club-join-application)

> 작성일: 2026-04-30
> 기능명: 클럽 가입 신청 시 신청 정보 입력 및 관리자 확인
> 프로젝트 레벨: Dynamic

---

## 1. 배경 및 목적

### 현재 상황

- `/clubs/[id]` 의 "가입 신청" 버튼 클릭 시 **빈 body** 로 `/api/clubs/[id]/join` 호출
- `/api/clubs/[id]/join` 은 `body.introduction` 을 받지만, UI 에서 입력하는 화면이 없음 → `ClubMember.introduction` 은 항상 `null`
- 클럽 관리 화면(`/clubs/[id]/manage`)의 "가입 대기" 탭은 신청자의 **이름/이메일/introduction** 만 노출. 성별/연락처/출생년도는 표시되지 않음
- 슈퍼관리자가 **클럽별 가입 신청** 을 모아서 보는 화면이 없음 (`/admin/members` 는 플랫폼 회원 가입 승인만 다룸)

### 문제점

- 클럽 소유자가 신청자 정보가 부족해 승인/거절 판단이 어려움
- 신청자가 자기소개를 전달할 수단이 없음
- 슈퍼관리자가 클럽 운영 모니터링 시 가입 신청 흐름을 한눈에 볼 수 없음

### 목표

1. 회원이 클럽 가입 신청 시 **자기소개 + 본인 프로필 요약(연락처/성별/출생년도)** 을 확인하고 신청
2. 클럽 소유자/매니저가 가입 신청 정보를 **상세 다이얼로그** 로 조회 후 승인/거절
3. 슈퍼관리자가 **모든 클럽의 가입 신청** 을 한 화면에서 모니터링하고 직접 승인/거절 가능

---

## 2. 기능 요구사항

### FR-01: 가입 신청 다이얼로그 (신청자)

- `/clubs/[id]` "가입 신청" 클릭 시 **다이얼로그(모달)** 오픈
- 다이얼로그 내용:
  - 클럽명/설명 요약
  - **자기소개 입력란** (textarea, 필수, 10~500자) — `ClubMember.introduction` 에 저장
  - **본인 프로필 요약 (읽기 전용)**: 연락처, 성별, 출생년도 → User 프로필에서 자동 가져옴
  - 프로필 미입력 항목이 있으면 "프로필에서 입력해주세요" 안내 + `/user/profile` (또는 기존 프로필 페이지) 링크
  - 개인정보 안내 문구: "신청 정보는 클럽 운영자 및 플랫폼 관리자에게 공개됩니다"
  - "신청하기" / "취소" 버튼
- 제출 시 `POST /api/clubs/[id]/join` `{ introduction }`
- 성공 시 다이얼로그 닫고 페이지 갱신, 실패 시 에러 토스트/alert

### FR-02: 가입 사전 요건 강화 (API)

- 기존: 연락처(phoneNumber) 필수 체크
- 추가: 성별(gender) + 출생년도(birthyear) 필수 체크
- 자기소개(introduction) 필수 체크 (서버에서 길이 검증 10~500자)
- 누락 항목 명확히 응답 (`{ error, missingFields: ['gender', 'birthyear'] }`)

### FR-03: 클럽 관리 화면 신청자 상세 정보 (클럽 소유자/매니저)

- `/clubs/[id]/manage` "가입 대기" 탭 카드 클릭 시 **신청 상세 다이얼로그** 오픈
- 다이얼로그 표시 항목:
  - 신청자 이름/이메일/프로필 이미지
  - **자기소개** (introduction)
  - **연락처** (phoneNumber, 복호화)
  - **성별** (gender)
  - **출생년도 → 만 나이 계산** (birthyear 복호화 후 `현재년도 - birthyear`)
  - 가입 신청일 (createdAt)
  - 승인 / 거절 버튼 (거절 시 사유 입력 다이얼로그)
- 기존 인라인 카드의 승인/거절 버튼은 유지 (간편 처리용)
- API: 기존 `GET /api/clubs/[id]?_members=pending` 응답에 신청자 민감정보 포함 → **권한 체크 후** 복호화하여 응답

### FR-04: 슈퍼관리자 클럽 가입 신청 통합 화면

- 새 페이지: `/admin/club-applications`
- 모든 클럽의 `status='PENDING'` `ClubMember` 목록 표시 (정렬: 최신 신청순)
- 카드 항목: 클럽명 + 신청자 정보 (FR-03 동일 항목)
- 슈퍼관리자가 직접 **승인 / 거절** 가능 (기존 `/api/clubs/[id]/members/[memberId]` PATCH 엔드포인트는 이미 SUPER_ADMIN 권한 허용)
- `Navbar` 또는 `/admin/members` 페이지에서 진입 링크 추가
- API: `GET /api/admin/club-applications`
  - 권한: `SUPER_ADMIN` 만
  - 응답: `[{ memberId, clubId, clubName, introduction, createdAt, user: { name, email, phoneNumber, gender, birthyear, age } }]`

### FR-05: 신청 정보 보존

- 가입 거절(`REJECTED`) / 강퇴(`REMOVED`) / 탈퇴(`LEFT`) 시 `ClubMember` 레코드는 유지(`status` 변경)
- `introduction` 은 동일 레코드에 영구 보존 (재신청 시 재사용 OR 새 레코드)
- 재신청 시도 → 기존 PENDING 이면 409 (현재 동작 유지), REJECTED/LEFT 면 새 신청 허용 여부는 **Out of Scope**

---

## 3. 비기능 요구사항

| 카테고리 | 기준                                                                                    | 측정 방법                    |
| -------- | --------------------------------------------------------------------------------------- | ---------------------------- |
| 보안     | 민감정보(연락처/출생년도)는 권한자(클럽 소유자/매니저/슈퍼관리자)에게만 복호화하여 응답 | 코드 리뷰 + 권한 분기 테스트 |
| 성능     | 슈퍼관리자 통합 화면은 PENDING 100건 이내에서 < 500ms                                   | 서버 로그/직접 측정          |
| 접근성   | 다이얼로그 키보드 포커스 트랩, ESC 닫기                                                 | 수동 검증                    |
| 개인정보 | 가입 신청 시 "관리자에게 공개" 고지 표시                                                | UI 표시 확인                 |

---

## 4. 현재 코드 분석

### 데이터 모델 (`prisma/schema.prisma`)

- `ClubMember.introduction String?` — **이미 존재** ✅ (스키마 변경 불필요)
- `User.phoneNumber/gender/birthyear/birthday` — 모두 존재 ✅
- 민감 필드는 `util/encryption.ts` 의 AES-256-GCM 으로 암호화 저장

### API

- `POST /api/clubs/[id]/join` — `introduction` 받지만 UI 미연동, gender/birthyear 검증 없음
- `GET /api/clubs/[id]` — 멤버 정보에 introduction 포함되나 user 민감정보는 `select` 에서 제외됨 (현재 코드는 status='ACTIVE' 멤버만 반환). pending 정보는 별도 처리 필요
- `PATCH /api/clubs/[id]/members/[memberId]` — 이미 OWNER/MANAGER/SUPER_ADMIN 승인/거절 처리 구현됨 ✅

### UI

- `app/clubs/[id]/page.tsx` — 가입 신청 버튼이 빈 body로 호출 → **다이얼로그 도입 필요**
- `app/clubs/[id]/manage/page.tsx` — 신청자 카드는 introduction만 표시 → **상세 다이얼로그 추가**
- 슈퍼관리자 페이지 신규 생성 필요

### 공용 인프라

- `useDialog` (`hooks/useDialog`) — 이미 존재 (Promise 기반 imperative API)
- `Dialog` 컴포넌트 — `components/ui/dialog` 등 shadcn 기반 추정 (Design 단계에서 확인)

---

## 5. 구현 범위

### In Scope

- [ ] `/clubs/[id]` 가입 신청 다이얼로그 컴포넌트 추가 (`components/club/JoinApplicationDialog.tsx`)
- [ ] `POST /api/clubs/[id]/join` 검증 강화 (gender/birthyear/introduction 길이)
- [ ] `joinClub` 서비스: introduction 필수화 + 누락 필드 응답
- [ ] `GET /api/clubs/[id]/pending-members` 신규 (또는 기존 GET 확장) — 권한자에게 민감정보 복호화 응답
- [ ] `/clubs/[id]/manage` 신청자 상세 다이얼로그 (`components/club/ApplicationDetailDialog.tsx`)
- [ ] `GET /api/admin/club-applications` 신규
- [ ] `/admin/club-applications` 페이지 신규
- [ ] `/admin/members` 또는 `Navbar` 에 슈퍼관리자 진입 링크 추가
- [ ] 출생년도 → 만 나이 변환 유틸 (`util/age.ts` 또는 인라인)

### Out of Scope

- 재신청 정책 변경 (REJECTED 후 재신청 허용 여부)
- 가입 신청 알림(이메일/푸시)
- 클럽별 추가 질문(custom fields) 정의 기능
- Prisma 스키마 변경 (현재 모델로 충분)

---

## 6. 의존성

- `useDialog` 훅 (기존)
- `react-hook-form` 또는 native form (기존 프로젝트 패턴 확인 필요)
- shadcn `Dialog`, `Textarea`, `Button` (기존)
- `util/encryption.ts` `decryptField` (기존)
- `service/club.ts` `joinClub` 수정
- `service/user.ts` 패턴 참조 (민감 필드 복호화)

---

## 7. 성공 기준

### Definition of Done

- [ ] 신청자가 자기소개 입력 후 가입 신청 → ClubMember.introduction 저장 확인
- [ ] 프로필 미입력(gender/birthyear) 시 친절한 안내 표시
- [ ] 클럽 소유자가 신청 상세 다이얼로그에서 연락처/성별/나이/자기소개 모두 확인 가능
- [ ] 슈퍼관리자가 `/admin/club-applications` 에서 모든 클럽의 PENDING 신청 조회/승인/거절 가능
- [ ] 클럽 멤버가 아닌 일반 유저가 다른 클럽의 신청 정보 API 호출 시 403 응답
- [ ] 민감정보가 평문으로 응답에 포함되지 않음 (필요 권한자에게만)

### Quality Criteria

- [ ] 0 lint errors
- [ ] TS 빌드 성공
- [ ] 권한 분기 수동 테스트 (일반 유저 / 매니저 / 소유자 / 슈퍼관리자)

---

## 8. 위험 및 완화

| 위험                                                                  | 영향   | 가능성 | 완화 방안                                                                        |
| --------------------------------------------------------------------- | ------ | ------ | -------------------------------------------------------------------------------- |
| 민감정보 권한 누수 (다른 클럽 owner 가 본인 클럽 외 신청자 정보 열람) | High   | Medium | API 라우트에서 `clubId` + `memberId` 조합 + `getClubRole` 강제 체크              |
| 기존 회원 중 gender/birthyear 누락 다수 → 가입 막힘                   | Medium | High   | 누락 항목 명확히 안내 + 프로필 페이지 직링크                                     |
| 출생년도 ↔ 나이 변환 오차 (만 나이/한국 나이)                        | Low    | Low    | "출생년도 + 만 나이" 둘 다 표시 또는 출생년도만 표시 (Design 에서 확정)          |
| introduction 길이 제한 우회 → DB 부담                                 | Low    | Low    | 서버 검증 (10~500자) + Prisma 컬럼은 String? 그대로 (제약은 애플리케이션 레이어) |

---

## 9. 아키텍처 결정

### 9.1 프로젝트 레벨

- **Dynamic** (Next.js App Router + Prisma + NextAuth + Tailwind/shadcn) — 기존 유지

### 9.2 핵심 결정

| 결정                | 옵션                                         | 선택                                   | 근거                                                         |
| ------------------- | -------------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| 신청 정보 저장 위치 | (a) ClubMember 스냅샷 / (b) User 프로필 참조 | (b) + introduction 만 ClubMember       | 스키마 변경 최소화, 본인이 프로필 업데이트 시 최신 정보 노출 |
| 신청 폼 구현        | 별도 페이지 / 모달 다이얼로그                | 다이얼로그                             | 기존 useDialog 인프라 + 짧은 입력 폼                         |
| 슈퍼관리자 진입점   | /admin/members 탭 추가 / 신규 페이지         | 신규 페이지 `/admin/club-applications` | 기존 페이지(회원 가입 승인)와 도메인 분리                    |
| 나이 표시           | 출생년도만 / 만 나이만 / 둘 다               | 둘 다 ("1990 (만 36세)")               | 정확성 + 가독성                                              |

---

## 10. 다음 단계

1. [ ] Design 문서 작성 (`/pdca design club-join-application`)
2. [ ] `useDialog` / `Dialog` 컴포넌트 실제 사용 패턴 확인
3. [ ] 슈퍼관리자 진입 동선(Navbar) 결정
4. [ ] 구현 시작 (`/pdca do club-join-application`)

---

## Version History

| 버전 | 날짜       | 변경 사항 | 작성자 |
| ---- | ---------- | --------- | ------ |
| 0.1  | 2026-04-30 | 초안 작성 | claude |
