# Changelog

All notable changes to the Rallify project are documented in this file.

---

## [2026-03-10] - DB마이그레이션 Phase 1-2 완료

### Added
- **Prisma ORM** 도입 및 설정 완료 (v5.22.0)
- **PostgreSQL (Supabase)** 데이터베이스 연결 구성
- **14개 Prisma 모델** 정의:
  - NextAuth: Account, Session, VerificationToken
  - Core: User, Schedule, GameResult, GameStatsPeriod
  - Relations: CourtNumber, Attendee, ScheduleComment, Game, GameComment, EditHistory
- **Prisma Client** 싱글턴 패턴 구현 (`lib/prisma.ts`)
- **초기 마이그레이션** SQL 생성 및 적용 (migration_id: 20260309115924_init)
- **데이터 마이그레이션 스크립트** (`scripts/migrate-sanity-to-postgres.ts`)
  - Sanity CMS → PostgreSQL 자동 이관

### Changed
- **Schedule.authorId**: NOT NULL → nullable (작성자 삭제 시 데이터 보전)
- **Database Architecture**: Sanity CMS → PostgreSQL + Prisma ORM
- **인증 어댑터 준비**: NextAuth Prisma Adapter 적용 예정

### Data Migration Results
- **Users**: 30/30 (100%) ✅ 완료
- **Schedules**: 93/99 (94%) ⚠️ 6건 원본 데이터 불량으로 미이관
- **GameResults**: 34/53 (64%) ⚠️ 6건 FK 위반 + 13건 원본 누락으로 미이관
- **GameStatsPeriod**: 0건 (스크립트 미구현) ❌
- **전체 이관율**: 157/182 (86%)

### Quality Metrics
- **Design Match Rate**: 98% (13/13 entities 100% match)
- **Migration SQL Compliance**: 100% (모든 제약조건 올바르게 설정)
- **Phase Completion**: Phase 1-2 (Schema & Env): 100%, Overall: 43%

### Fixed
- Migration SQL 외래키 제약조건 (CASCADE, RESTRICT, SET NULL) 모두 올바르게 설정
- Unique 제약조건 (username, email, sessionToken) 정확히 구현

### Known Issues
- Sanity 패키지 8개 아직 존재 (Phase 7에서 제거 예정)
- Service 레이어 마이그레이션 미완료 (Phase 3 필요)
- API 라우트 업데이트 미완료 (Phase 4 필요)
- NextAuth Prisma Adapter 미적용 (Phase 5 필요)
- GameResults 19건 미이관 (FK 및 데이터 무결성 문제)
- GameStatsPeriod 마이그레이션 미구현

### Next Steps
1. **Phase 3**: Service 레이어 (user.ts, schedule.ts, games.ts) Prisma 마이그레이션 → ~2일
2. **Phase 4**: API 라우트 업데이트 및 통합 테스트 → ~2일
3. **Phase 5**: NextAuth Prisma Adapter 적용 및 OAuth 검증 → ~1일
4. **Phase 6**: 데이터 마이그레이션 재실행 (GameStatsPeriod 추가) → ~1일
5. **Phase 7**: Sanity 패키지 제거 및 관련 코드 정리 → ~0.5일

### Documents
- **Plan**: [docs/01-plan/features/DB마이그레이션.plan.md](../01-plan/features/DB마이그레이션.plan.md)
- **Design**: [docs/02-design/features/DB마이그레이션.design.md](../02-design/features/DB마이그레이션.design.md)
- **Analysis**: [docs/03-analysis/DB마이그레이션.analysis.md](../03-analysis/DB마이그레이션.analysis.md)
- **Report**: [docs/04-report/features/DB마이그레이션.report.md](features/DB마이그레이션.report.md)

### Related Commits
- Initial commit: Rallify - 테니스 클럽 관리 앱

---
