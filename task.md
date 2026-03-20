# LMS User App Implementation Task

## Goal
Implement LMS in the `User` app using the backend LMS learner APIs, with a visually engaging learner experience.

Primary UX direction:
- User first selects a topic.
- Inside a topic, levels are shown in a **snake-and-ladder style progression board**.
- UI must match the existing `User` app visual language (spacing, typography, cards, theme handling).
- Experience should feel polished with meaningful animations.

## Scope
In scope:
- LMS topic listing page (learner).
- LMS topic details page with snake-and-ladder level map.
- Level details/attempt page.
- Video progress tracking.
- Quiz attempt submission.
- Level completion + unlock progression updates.
- Topic/global leaderboard views.
- Reusable LMS API layer + hooks + types.

Out of scope (for this task phase):
- Admin LMS authoring UI (already in Admin).
- Backend LMS changes.

## Backend API Contract (Learner)
Base: `/api/lms` (via User app proxy)
Auth: `Authorization: Bearer <token>`

Required learner endpoints:
- `GET /me/topics`
- `GET /me/topics/:topicId`
- `GET /me/levels/:levelId`
- `POST /me/levels/:levelId/video-progress`
- `POST /me/levels/:levelId/attempts`
- `POST /me/levels/:levelId/complete`
- `GET /me/progress`
- `GET /leaderboard/global`
- `GET /leaderboard/topics/:topicId`

Reference: `Backend/LMS_API_DOCUMENTATION.md`

## Information Architecture (User App)
Proposed routes:
- `/dashboard/lms` -> Topic list
- `/dashboard/lms/[topicId]` -> Topic progression board (snake-and-ladder)
- `/dashboard/lms/levels/[levelId]` -> Level runtime page (content + questions + completion)
- `/dashboard/lms/leaderboard` -> Global leaderboard (optional tab in LMS home)

## UX Requirements
### Topic List
- Show published/active topics available to learner.
- Each topic card should show:
  - title, description
  - progress summary (completion %, completed/total levels)
  - CTA: `Continue` or `Start`

### Snake-and-Ladder Topic Board
- Levels should alternate left-right per row in serpentine pattern.
- Draw connectors between sequential levels to mimic a board path.
- Visual states for each level:
  - `LOCKED`
  - `UNLOCKED`
  - `IN_PROGRESS`
  - `COMPLETED`
- Current playable level should be visually highlighted.
- Completed level should show success badge/check.

### Level Runtime Page
- Render ordered content blocks first (video/reading).
- Render ordered questions after required content.
- Submit answers via attempts API.
- Trigger completion API and reflect unlock state in UI.

## Animation Requirements
Use tasteful, non-distracting motion:
- Board load animation:
  - staggered reveal of level nodes
  - light connector draw-in effect
- Node interaction:
  - hover lift/glow for unlocked nodes
  - pulse/ring for current level
  - completion pop/check animation
- Transition:
  - smooth route transition between board and level page

Performance constraints:
- Respect reduced-motion preferences.
- Keep animations GPU-friendly (transform/opacity first).
- Maintain smooth performance on mobile.

## Technical Plan
1. LMS API client
- Add `src/lib/api/lms.ts` for learner endpoints.
- Normalize response shapes into stable frontend types.

2. LMS hooks
- Add `src/hooks/lms.ts` using React Query.
- Query keys for topics, topic detail, level detail, progress, leaderboard.

3. Types
- Add/update `src/types/lms.ts` for topic/level/progress/attempt contracts.

4. Pages
- Implement `/dashboard/lms` page.
- Implement `/dashboard/lms/[topicId]` page with snake-board.
- Implement `/dashboard/lms/levels/[levelId]` page.

5. Components
- `src/components/lms/topic-card.tsx`
- `src/components/lms/snake-board.tsx`
- `src/components/lms/level-node.tsx`
- `src/components/lms/level-content.tsx`
- `src/components/lms/level-quiz.tsx`
- `src/components/lms/leaderboard.tsx`

6. Styling and motion
- Reuse existing design tokens and utility classes.
- Add focused animation classes/components only for LMS interactions.

7. Error/loading states
- Skeletons for board and level page.
- Empty-state for no published topics.
- Clear retry flows for failed API calls.

## Acceptance Criteria
- Learner can open LMS home and view assigned/published topics.
- Learner can open a topic and see snake-and-ladder progression layout.
- Locked levels are not navigable.
- Unlocked/current levels are navigable.
- Learner can consume level content and submit quiz attempt.
- On successful completion, next level unlocks and board updates.
- Topic progress reflects backend progress values.
- UI matches existing User app style and works on mobile + desktop.
- Animations are smooth and disabled/reduced for reduced-motion users.

## Implementation Notes
- Keep endpoint pathing consistent with existing User proxy strategy.
- Avoid introducing a parallel API pattern; follow current axios + query conventions.
- Ensure auth token forwarding works for LMS endpoints.
- Prefer composable components so future LMS gamification widgets can plug in.

## Next Step
Start with Phase 1:
- Add LMS API client + hooks + types,
- then scaffold `/dashboard/lms` and `/dashboard/lms/[topicId]` with static board layout,
- then integrate live data.
