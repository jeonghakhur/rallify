# Gap Detector Memory

## Project: tennis-tab

### Club Management Gap Analysis (2026-02-11)
- Overall Match Rate: 93% (2nd iteration, up from 85%)
- Fixed gaps: MemberInviteModal (inline in ClubMemberList), DB migration (06_club_management.sql), GenderType (MALE/FEMALE unified)
- Remaining gaps: claimMembership() not implemented (Medium), 6 components inline instead of separate files (Low), semantic CSS classes unused (Low)
- Auth helpers use { error, user } return pattern instead of throw (project convention, intentional)
- globals.css semantic classes (.badge-role-*, .input-field) defined but not used in components (inline Tailwind instead)
- 8 additional Server Actions added beyond design: getClubMembers, searchUsersForInvite, getClubPublicMembers, getMyClubMembership, searchClubsForJoin, getClubMemberCount, getAssociation, searchUsersForManager
- Components: 5/11 as separate files; MemberInviteModal, AddMemberModal, RemoveReasonModal inline in ClubMemberList
- Check stage passed (>=90%), ready for Report stage

### NLP Chat Gap Analysis (2026-02-27)
- Overall Match Rate: 95% (1st iteration)
- Plan doc is unified plan+design (no separate design doc)
- Key gaps found:
  - agent.ts PAYMENT_LABEL missing `PAID: '완납'` (cancelFlow has it, agent doesn't)
  - entryFlow TTL: Plan says 30min, impl is 10min (sessionStore.ts)
  - Plan Section 3.2 trigger table not updated for UPCOMING status (only in changelog)
  - get_awards: Plan lists tournament_name param, impl doesn't have it
  - get_my_entries: Plan lists status_filter, impl split into entry_status + payment_status
- All Gemini issue mitigations (Section 4) fully implemented: 14/14
- All security fixes verified: DRAFT filter, functionResponse JSON, admin client delete, sanitizeInput
- Check stage passed (>=90%)

### Member Data Encryption Gap Analysis (2026-02-27)
- Overall Match Rate: 93% (1st iteration)
- All crypto APIs (encrypt/decrypt/isEncrypted/encryptProfile/decryptProfile) match design
- All Server Action integrations match (auth/actions.ts, chat/entryFlow/queries.ts)
- Migration script: DRY_RUN, PAGE_SIZE=100, BATCH_SIZE=10, per-row error skip all match
- Missing: .env.example ENCRYPTION_KEY not added, decrypt() no try-catch for corrupted data, migration log file not generated
- Added: 2 test files not in design Section 7 (but mentioned in Section 6)
- Check stage passed (>=90%), ready for Report stage

### Guest Participant Gap Analysis (2026-03-03)
- Overall Match Rate: 90% (1st iteration)
- Key gaps: Migration 23 SQL file missing (DB applied manually), addSessionGuest missing session status check (COMPLETED), removeSessionGuest missing COMPLETED match check, MatchResultForm missing guest name fallback
- SchedulePlayer type changed: gamesPlayed removed (external Record), id field added, time as number (minutes) instead of string
- Server Action signatures simplified: clubId removed from params (extracted internally via session JOIN)
- getSessionGuests uses admin client instead of design's RLS client
- createMatchResult uses flat CreateMatchInput instead of design's nested { team1: { main: PlayerSlot } }
- MemberResultsClient guest fallback not needed (server already merges via getMemberGameResults)
- All permission checks match (checkSessionOfficerAuth for add/remove/create/auto-schedule)
- 5 added features: PGRST200 fallback, match edit guest restore, getSessionPageData parallel query, guest count/chip display
- Check stage passed (>=90%)

### Tournament Awards Gap Analysis (2026-03-04)
- Overall Match Rate: 91% (1st iteration)
- DB schema 100% match (all columns, RLS, indexes, trigger)
- Types 100% match (impl has stricter union types for game_type/award_rank)
- claimAward: return type changed { success, error? } -> { error? } (project pattern)
- ProfileAwards/ClubAwards: Client Supabase query -> Server Action pre-fetch (better pattern)
- AwardsList: Server-safe -> Client Component (for admin modal/delete features)
- AwardsFilters: native select -> Radix UI Select (design system consistency)
- Missing: ProfileAwards stats grid, ClubAwards summary stats, /awards metadata, viewAwards tournament_name filter
- 17 added features: admin register/edit/delete/rating management, awardGrouping util, 12 Server Actions
- Plan "admin /admin/awards UI -> front claim UI" was actually implemented as inline admin features in /awards page
- viewAwards handler uses getAwards() Server Action (DRY) instead of direct admin client query
- Check stage passed (>=90%)

### Player Bracket View Gap Analysis (2026-03-04)
- Overall Match Rate: 93% (1st iteration)
- Missing items: 1 ("나의 경기" badge, Low - replaced by highlight style)
- Changed items: 11 (all intentional, low impact)
  - entry status APPROVED -> CONFIRMED (project-wide naming)
  - submitPlayerScore returns { data: { winnerId }, error: null } instead of { success: true }
  - Error display: AlertDialog -> Toast(error) for UX consistency
  - Match status: SCHEDULED only -> SCHEDULED OR COMPLETED (FR-11 score edit)
  - "Score input" button -> entire card clickable (mobile UX)
  - "View bracket" button: IN_PROGRESS only -> IN_PROGRESS OR COMPLETED
  - myEntries status filter removed (no practical security impact)
  - getUserStats: matches+bracket hybrid -> bracket_matches only (legacy removed)
  - ScoreInputModal team mode size: xl -> lg
  - Team player select: native -> Radix UI Select
  - getPlayerEntryIds: no error field in return type
- Added items: 13 (security hardening + UX improvements)
  - tournamentStatus prop, checkTournamentNotClosedByMatchId, invalidateDownstreamMatches
  - checkAndCompleteTournament, createAwardRecords, existing score load, my group/match sort to top
  - Round progress display, auto-select my match round, Realtime subscription
  - Court info display, COMPLETED edit support, "View bracket/results" label split
- Convention: MatchCard div onClick has role="button" + tabIndex + onKeyDown (correct), ScoreInputModal inputs have aria-label (correct)
- Check stage passed (>=90%), ready for Report stage

### Native App Prep Gap Analysis (2026-03-05)
- Overall Match Rate: 81% (1st iteration)
- 4 documents analyzed: native-screens.md (82%), shared-code.md (78%), supabase-schema.md (75%), project-structure.md (90%)
- Critical: bracket_matches column names wrong (config_id->bracket_config_id, entry1_id->team1_entry_id, score1->team1_score, round->round_number, is_bye doesn't exist)
- Critical: club_members has own name/phone/rating/gender fields (not profiles JOIN), supports unregistered members (is_registered=false, user_id=NULL)
- Critical: club_member_stats column names wrong (member_id->club_member_id, total_matches->total_games, draws doesn't exist, last_updated->updated_at)
- Critical: club_session_attendances.member_id -> club_member_id
- Missing: 15 screens not in native-screens.md (auth/error, payment callbacks, support/*, clubs/members/*, my/clubs/*)
- Missing: 6 Server Actions not in shared-code.md (entries, payment, associations, support, faq, storage)
- Missing: src/lib/chat/ (21 files) and src/lib/realtime/ (4 hooks) not mentioned
- Missing: bracket_configs Realtime (migration 26) not in Realtime table list
- Missing: club_member_role expanded with VICE_PRESIDENT, ADVISOR, MATCH_DIRECTOR (migration 18)
- Missing: gender_type enum, match_type 'doubles' value
- Check stage NOT passed (<90%), Act phase needed

### Home Feed Gap Analysis (2026-03-09)
- Overall Match Rate: 96% (2nd revision)
- Major structural change: UpcomingDeadlines + LiveResults -> ActiveTournamentsSection (single section)
- DeadlineTournamentCard -> ActiveTournamentCard (status-aware card with badge+button)
- LiveResultsSection removed entirely (replaced by "대진표 보기" button on IN_PROGRESS cards)
- getActiveTournaments() added: OPEN+IN_PROGRESS unified query, JS .sort() for IN_PROGRESS-first
- 3 dead code files identified: UpcomingDeadlinesSection.tsx, DeadlineTournamentCard.tsx, LiveResultsSection.tsx
- 4/4 design Server Actions exist (100%), 19/19 DB query filters match (100%)
- FloatingChat hidden pattern for history preservation: correctly implemented
- All sections have aria-label, empty sections return null
- Changed: ClubSessionWithClub flat interface, LiveTournament winnerId -> winnerEntryId + teamEntryIds, horizontal scroll -> vertical list
- Added: isLoggedIn prop (FeedCard), aria-expanded, focus-visible ring, bracketExists filter
- Check stage passed (>=90%), ready for Report stage

### Analysis File Locations
- Plan: docs/01-plan/features/nlp-chat.plan.md
- Analysis: docs/03-analysis/nlp-chat.analysis.md
- Club Design: docs/02-design/features/club-management.design.md
- Club Plan: docs/01-plan/features/club-management.plan.md
- Club Analysis: docs/03-analysis/club-management.analysis.md
- DB Migration: supabase/migrations/06_club_management.sql
- Encryption Design: docs/02-design/features/member-data-encryption.design.md
- Encryption Analysis: docs/03-analysis/member-data-encryption.analysis.md
- Guest Design: docs/02-design/features/guest-participant.design.md
- Guest Plan: docs/01-plan/features/guest-participant.plan.md
- Guest Analysis: docs/03-analysis/guest-participant.analysis.md
- Awards Design: docs/02-design/features/tournament-awards.design.md
- Awards Plan: docs/01-plan/features/tournament-awards.plan.md
- Awards Analysis: docs/03-analysis/tournament-awards.analysis.md
- Player Bracket View Design: docs/archive/2026-03/player-bracket-view/player-bracket-view.design.md
- Player Bracket View Plan: docs/01-plan/features/player-bracket-view.plan.md
- Player Bracket View Analysis: docs/03-analysis/player-bracket-view.analysis.md
- Native App Prep Docs: docs/native-app-prep/*.md (4 files)
- Native App Prep Analysis: docs/03-analysis/native-app-prep.analysis.md
- Home Feed Design: docs/02-design/features/home-feed.design.md
- Home Feed Analysis: docs/03-analysis/home-feed.analysis.md
