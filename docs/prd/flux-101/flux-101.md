# PRD: FLUX 101 — Gamified Beginner Course

| | |
|---|---|
| **Status** | Implemented on `feat/flux-101` (2026-10-06), PR pending; companion flux-id PR #682 open, credits UI appears once it deploys |
| **Author** | Product (AI PM agent); revised with Engineering |
| **Created** | 2026-06-30 |
| **Revised** | 2026-10-06 (decisions D11–D24 below supersede the v1 text; §8a is the merge checklist) |
| **Tracking** | ClickUp <https://app.clickup.com/t/5719332/86ey3weh9> (v1 PRD and the interactive HTML mockup are attached there; the mockup is intentionally **not** in this repo) |
| **Target product** | Beam Studio (desktop + web) |
| **Owner area** | Onboarding / Tutorials, FLUX ID account, Welcome page, Left control bar, Help menu |
| **Companion PRD** | [FLUX 101 — flux-id backend](credits-backend.md): progress-sync column + credit grant endpoint (owned by the flux-id repo) |
| **Related code** | `packages/core/src/web/app/components/tutorials/`, `app/actions/beambox/beambox-init.ts` (`showStartUpDialogs`/`showTutorial`), `helpers/api/alert-config.ts` (`skip-interface-tutorial`), `app/pages/Welcome.tsx`, `app/components/beambox/LeftPanel/components/DrawingToolButtonGroup.tsx`, `helpers/api/flux-id/activity.ts` (`getPreference`/`setPreference`), `app/components/beambox/TopBar/useMenuData.ts` (`helpMenu`), `app/widgets/DraggableModal.tsx`, `helpers/confetti.ts`, `app/stores/storageStore.ts`, `helpers/device-master.ts` (`currentDevice`) |

---

## 1. Summary

Beam Studio's onboarding is a scripted overlay walkthrough (`tutorials/Tutorial.tsx`) that teaches a few mechanical steps. FLUX already has a **23-video "Laser Cutter 101" curriculum** on YouTube (playlist `PL97IZXQ17KZ8WhfmCDFn0ZBLRYkWAQRXu`, ~33 min total) that most new users never find.

**FLUX 101** surfaces that curriculum inside the app as a chaptered course with progress, badges, a certificate, and a small FLUX+ credit reward per lesson. Because the point is to learn *Beam Studio*, the course ships a **minimizable picture-in-picture (PiP) player**: shrink the video into a corner and do the thing you just watched on the real canvas. Progress is stored locally per user and synced to the FLUX ID account.

The course is named **FLUX 101** (it covers hardware setup too); the internal `courseId` / local storage key is `beam-studio-101`.

Engineering review (2026-09-18) confirmed the feature is mostly new UI over existing primitives: `DraggableModal` / `react-draggable` for the PiP shell, `helpers/confetti.ts` for celebrations, `storageStore` for local persistence, and the FLUX ID `bxpref` preference endpoint for sync. Two small backend changes are required (see companion PRD): a JSON column on `BeamStudioPreference` for progress, and an idempotent credit-grant endpoint.

## 2. Background & current state

- **Scripted tutorial** — `tutorials/Tutorial.tsx`, `TutorialContext.tsx`, `tutorialController.ts`, steps in `constants/tutorial-constants.tsx`. On launch `showStartUpDialogs()` → `showTutorial(isNewUser)` (`beambox-init.ts` ~L124), gated by `AlertConfig.read('skip-interface-tutorial')`, which is set `true` once the user declines or completes it. FLUX 101's post-tutorial nudge hangs off this resolve.
- **Media tutorial dialog** — `dialogs/MediaTutorial.tsx` plays local `.webm/.mp4` in an antd Modal. Closest precedent to a video lesson; no YouTube, no progress.
- **Welcome page** — `pages/Welcome.tsx` (`/studio/welcome`) is a tabbed hub (`menuItems` + `contents`: Recent Files, My Cloud, Follow Us, Help Center, Beamy, Design Market). FLUX 101 becomes a new tab.
- **Left control bar** — `LeftPanel/components/DrawingToolButtonGroup.tsx`; the Beamy button sits below a separator and toggles a drawer mode. The FLUX 101 book icon goes in the same region.
- **FLUX ID** — `helpers/api/flux-id/base.ts`; `activity.ts` exposes `getPreference(key)` / `setPreference({key: value})` → `software-preference/bxpref`. **Note:** the server model (`BeamStudioPreference`) has fixed columns, not a free key/value store — unknown keys are silently dropped. A `flux101_progress` JSON column must be added server-side (companion PRD). Precedent: `did_gesture_tutorial` in `beambox-init.ts` ~L89.
- **Local persistence** — `stores/storageStore.ts` (Zustand over `storage`, cross-tab sync); keys enumerated in `constants/storageConstants.ts`.
- **Draggable / celebration primitives** — `widgets/DraggableModal.tsx` (42 usages, `react-draggable`), `helpers/confetti.ts` (`rainConfetti`, `popConfetti`, reduced-motion aware).
- **Embedding** — Electron `tabManager.ts` strips `Content-Security-Policy` response headers; the web `index.html` sets no CSP meta. YouTube iframes work in both targets. External-iframe precedent: `components/Chat/index.tsx`.
- **Machine context** — `deviceMaster.currentDevice` (selected machine) and `useDocumentStore().workarea`. `fbm1` = beamo, `fbm2` = beamo II.

## 3. Goals & non-goals

**Goals**
- **G1** Surface the 23-video curriculum in-app as a chaptered course with a clear "Continue" path.
- **G2** Make completion feel rewarding: celebration, badges, certificate, FLUX+ credits.
- **G3** Persist progress locally per user and sync to FLUX ID.
- **G4** Watch-and-do via a minimizable, draggable PiP player that remembers playback position.
- **G5** Introduce the course to new users once, at the right moment, without nagging returning users.

**Non-goals**
- **N1** Replacing the scripted tutorial. FLUX 101 complements it.
- **N2** Hosting video, captions, or localized re-shoots. v1 embeds the existing English YouTube videos.
- **N3** Randomized rewards or leaderboards. Rewards are deterministic.
- **N4** Quizzes or graded assessment. Completion is watch-based (or explicitly marked done).
- **N5** A general course platform. v1 is one hardcoded curriculum.
- **N6** Mobile PiP. Mobile gets dialog mode only (D17).
- **N7** Deep-links from lessons into app features (`relatedFeature`). Dropped from v1 (D12).

## 4. Users & use cases

- **First-time owner** — just unboxed a machine; wants to be walked from zero and feel progress.
- **Returning hobbyist** — has gaps; jumps to the chapters they don't know.
- **Watch-and-do learner** — keeps the video in the corner and mimics on the canvas.
- **Multi-device user** — expects the same progress on the laptop and the shop PC after login.

## 5. Experience overview

### 5.1 Entry points

Persistent (always available):
1. **Left control bar → book icon** (R1a). Below the separator next to Beamy. Tooltip "FLUX 101". antd `Badge` (`size="small"`) shows the number of remaining lessons (max 23, so no overflow handling). Opens the course dialog; also the collapsed home of the course when closed (§5.3).
2. **Welcome page → "FLUX 101" tab** (R1b). A new `menuItems` entry whose content is the course dashboard rendered inline (list + player), sharing components with the editor dialog. No PiP on this page.
3. **Help menu → "FLUX 101"** (R1c). New `START_101_COURSE` item near `START_TUTORIAL`. In the editor it opens the course window; on the Welcome page it switches to the FLUX 101 tab instead (the tab already hosts the player, and a window on top would mount a second one).

Contextual (once):
4. **After the new-user tutorial** (R2a). When `showTutorial` resolves (accepted or declined), show a one-time prompt: *"Want to go deeper? FLUX 101 has 23 short videos that take you from unboxing to your first job."* **[Maybe later] / [Watch FLUX 101]** (Watch is the primary button, on the right). Answering either way sets `nudgeDismissed`; Watch also opens the course. Awaited like the tutorial so the later start-up dialogs do not stack on it. Desktop only (`!isMobile()`); unlike the tutorial it does not need a machine connection, since users who have not set one up yet are the course's audience.

The v1 "continue learning" notification on every app open (formerly R2b) is **dropped** (D18): it contradicted G5. The book-icon badge carries the reminder.

### 5.2 Course dashboard

Chapters → lessons with per-lesson status (✓ completed · ▶ next up · ○ not started), an overall progress meter, earned badges, credits earned, sync state, and a **Continue** CTA targeting `lastLessonId` (or 1-1). Chapters are recommended-linear, not locked (D1). Each lesson row shows its duration and, for `watched` lessons, a `+0.5` credit tag — yellow once the server confirmed the grant, grey outline (tooltip: granted once signed in and online) while pending; `marked_done` rows get a green check tag in the same slot (tooltip: marked by hand, watch the video to earn credits) (so hand-marked and watched lessons are distinguishable at a glance). lessons with a Help Center article show a grey hint line with an external-link icon that opens the article via `browser.open` (D12).

### 5.3 Lesson + PiP player

Two presentation modes over one player instance:

- **Dialog mode (default)** — centered modal, lesson list left, embedded player right, canvas dimmed behind. Controls: **Minimize**, **Close (✕)**, **Prev / Next**, **Mark done**.
- **PiP mode** — **Minimize** collapses to a small draggable always-on-top player over the canvas; the canvas and panels stay fully interactive. **Expand** returns to dialog mode.
- **Closed** — **Close (✕)** in either mode stops playback and collapses the course into the book icon. No floating chip is left on the canvas. Reopening restores the last lesson and playback position.

The player (`Flux101Player`) is rendered inside whichever slot is on screen. Switching dialog ⇄ PiP therefore remounts the `<iframe>` (about half a second of black); if the video was playing, the new player autoplays from the saved resume point, so the viewer only sees a brief reload. Opening the course never autoplays (D24).

### 5.4 Completion celebration

On lesson completion: confetti (`popConfetti` from the player), check-stamp on the lesson, progress bar animates, and, once the server confirms the grant, a "+0.5 FLUX+ credits" tag (R12a). A centred `CelebrationDialog` (after the ClickUp draft: icon, headline, lesson, chapter progress bar, **Back to course** / **Next ›**) opens on every completion — including when a hand-marked lesson is later actually watched, the moment its credit is earned; when the chapter just completed, its icon is the badge emoji and the headline names the badge. Course complete (23/23) → certificate modal + `rainConfetti` instead. XP is not shown (D20). Both dialogs are opened imperatively (`showCelebrationDialog` / `showCertificate` in `Flux101/index.tsx`, `dialog-controller`) and fire their own confetti on mount, so they work from the course window, from PiP and from the Welcome tab alike. `Flux101/useCelebration.tsx` (mounted in `Flux101Dialog` and `TabFlux101`) diffs the completed set between renders of the active bucket — so it fires for watched and marked-done alike, and never on first mount. Once complete, a 🎓 button in the dialog header and on the Welcome tab reopens the certificate (`Flux101Certificate.tsx`).

The course window header carries, next to the title: an `N / 23` tag; a yellow `+N` credits tag (hover: "N FLUX+ credits earned") when any credit was granted; and the sync state — signed in: green **Synced** / grey **Not synced** from the last `bxpref` push result (`flux101Store.synced`, undefined until the first push of the session, reset on logout); signed out: a clickable **Sign in** tag (hover: sign in to sync progress and earn credits) that opens the FLUX ID login.

XP is **not shown** pending the meeting decision (D20); if kept, it is derived, never stored.

### 5.5 States

- **Logged out** — course works fully on the local `anonymous` bucket; "Sign in to save your progress" affordance.
- **Logged out, anonymous bucket already claimed by another account, online** — once per app session, on opening the course, show: *"This progress is bound to s******e@example.com. Sign in to keep earning rewards."* **[Skip] / [Sign in]** (Sign in is the primary button, on the right; Skip reuses `global.skip`). Email mask: first and last character before `@`, domain in full (D14).
- **Offline** — dashboard renders from local progress; player shows "You're offline"; ✓ persist.
- **Empty** — Chapter 1 expanded, "Start lesson 1-1" hero CTA.
- **Error** — video fails → inline retry + "Open on YouTube" (`browser.open`).

## 6. Data model

### 6.1 Course catalog (static, in-bundle)

| Field | Type | Notes |
|---|---|---|
| `courseId` | string | `'beam-studio-101'` |
| `version` | number | Bumped when lessons change; drives merge tolerance (§9). |
| `chapters[].id` | string | `'ch1'`… |
| `chapters[].title` | i18n key | |
| `chapters[].badge` | `{ emoji, title: i18n key }` | Awarded on chapter completion. |
| `chapters[].lessons[].id` | string | Curriculum number, e.g. `'2-4'`. **Stable, never reused.** |
| `chapters[].lessons[].title` | i18n key | |
| `chapters[].lessons[].youtubeId` | string | |
| `chapters[].lessons[].durationSec` | number | For the 90 % threshold. |
| `chapters[].lessons[].helpArticleId` | string? | Zendesk article id (shared by every locale); `helpArticleUrl(id)` in `catalog.ts` builds `https://support.flux3dp.com/hc/{zh-tw\|en-us}/articles/{id}` — only those two locales, since other translations are not guaranteed to exist. Filled 2026-10-06 for 1-3, 3-1, 3-2, 3-3, 4-1 … 4-5, 5-3 from the Beam Studio and 材料 categories; 3-4 / 3-5 / 4-6 / 5-1 have no matching article yet. The machine-operation lessons (1-2, 2-1, 2-2, 2-3, 3-6, 5-2) carry a `{ model: id }` map instead — resolved for the current machine (`deviceMaster.currentDevice`, else the workarea model; `helpArticleIdFor`), e.g. 2-1 → each model's 水箱加水, 3-6 → its 夾爪型旋轉軸 install article, 5-2 → its 材料切不斷; models without such an article (no water tank on Ador / HEXA RF / Promark, no focusing article on Promark) show no link. 2-4 and 4-7 have no fitting per-model article either. |

The **2-1 Filling Water Tank** note for beamo / beamo II is a hardcoded special case in the lesson view (D13), not a generic `applicabilityNotes` structure: shown when `deviceMaster.currentDevice?.info.model` is `fbm1`/`fbm2`, falling back to `useDocumentStore().workarea` when no machine is selected (D21). Informational only.

#### 6.1.1 The v1 catalog

| Lesson | Title | `youtubeId` | Length |
|---|---|---|---|
| **Chapter 1 · Before You Start** — badge *Safety First 🦺* | | | |
| 1-1 | Introduction | `3hvYRIgaNaI` | 1:19 |
| 1-2 | Safety Consideration | `MtJ0hqvXkRc` | 1:53 |
| 1-3 | Materials & Compatibility | `EDjQ3bqCX-k` | 1:23 |
| **Chapter 2 · Machine Setup** — badge *Calibrated 🎯* | | | |
| 2-1 | Filling Water Tank | `c64vKb833ZY` | 3:40 |
| 2-2 | Focusing the Laser | `6NqdVgtOG94` | 2:01 |
| 2-3 | Camera Calibration | `a3UNqM7JTO4` | 1:00 |
| 2-4 | How to Scan | `wYxXhfNwBmg` | 1:38 |
| **Chapter 3 · Preparing Artwork** — badge *Image Wrangler 🖼️* | | | |
| 3-1 | File Types | `5qpUEVveO6c` | 1:32 |
| 3-2 | Importing Layers | `YXj-6iE6QV8` | 1:11 |
| 3-3 | Threshold & Gradient | `v0Qw08OrRvg` | 0:54 |
| 3-4 | Converting Vector | `0WzA-yJuoDo` | 1:07 |
| 3-5 | Image Trace | `Y_SQBcIiqSg` | 0:51 |
| 3-6 | Rotary Engraving | `bx6thjbQZb4` | 0:49 |
| **Chapter 4 · Designing in Beam Studio** — badge *Canvas Apprentice 🎨* | | | |
| 4-1 | Beam Studio Overview | `6GRp28sEHlA` | 1:35 |
| 4-2 | Create Shapes & Texts | `ntsRHEm62io` | 1:38 |
| 4-3 | Boolean Operations | `HNn292DVlM0` | 0:56 |
| 4-4 | Importing Files | `11Birvpo7mU` | 0:53 |
| 4-5 | Layers | `HD5pAL3ILUA` | 1:18 |
| 4-6 | Configuring Cut Settings | `El9b93AE-mM` | 0:52 |
| 4-7 | Preview & Send Jobs | `kFMPJdaDzpo` | 1:31 |
| **Chapter 5 · Dialing It In** — badge *101 Graduate 🎓* (+ certificate) | | | |
| 5-1 | Power & Speed | `Rg5wjtBDIcw` | 1:31 |
| 5-2 | Troubleshooting | `zkuiSxIHtD8` | 1:12 |
| 5-3 | Material Testing | `kK4pgCDC9mw` | 1:46 |

23 lessons, ~33 min, max 11.5 credits (0.5 × 23), 5 badges, 1 certificate.

### 6.2 Per-user progress (the persisted state)

**Store source data only; derive everything else** (D11). XP, credits earned, badges, and certificate status are computed from `lessons` + the catalog at render time. This removes double-counting risks and simplifies the merge.

Local storage key `beam-studio-101` holds a map of **buckets keyed by owner**:

```ts
type Flux101Storage = {
  anonymous: Flux101Bucket & { claimedBy?: string /* email */ };
  [email: string]: Flux101Bucket; // lower-cased FLUX ID email (IUser only guarantees email)
};

type Flux101Bucket = {
  catalogVersion: number;
  lessons: Record<LessonId, LessonProgress>;
  lastLessonId?: LessonId;
  nudgeDismissed?: true;     // R2a prompt answered; OR-ed on merge
  updatedAt: string;         // ISO
};

type LessonProgress = {
  status: 'in_progress' | 'completed';   // absent = not started
  playedSec: number;                     // seconds actually spent in PLAYING state (not max position)
  resumeSec: number;                     // last playback position, for resume
  completedAt?: string;
  completedVia?: 'watched' | 'marked_done';
  creditGranted?: boolean;               // server-confirmed grant; idempotency guard
};
```

The **active bucket** is the logged-in user's bucket (keyed by email), or `anonymous` when logged out. All writes go to the active bucket.

**Lifecycle**
- `completed` when `playedSec ≥ 0.9 × durationSec`, or the YouTube player reports `ENDED`, or the user taps **Mark done** (`completedVia = 'marked_done'`). Completion is monotonic.
- Chapter badge = all its lessons completed. Certificate = all chapters complete. Both derived.
- Credit: on first `completedVia = 'watched'` completion of a lesson, a logged-in user requests a grant (companion PRD). `marked_done` completes the lesson but earns no credit (D7). Logged-out `watched` completions are granted when the bucket is claimed (§9).

## 7. Player (the new infrastructure)

- **YouTube IFrame Player API** on `youtube-nocookie.com` (`host` option), loaded lazily once. Used for: `onStateChange` (PLAYING / PAUSED / ENDED), a 1 s `setInterval` while PLAYING that increments `playedSec` and records `resumeSec` via `getCurrentTime()`, `seekTo(resumeSec)` on open, and `pauseVideo()` on tab blur (D16). Counting *played* seconds rather than max position means scrubbing to the end does not count as watched.
- **No autoplay.** The user presses play; videos need sound and autoplay-with-sound is blocked by browser policy anyway (D15).
- **PiP shell** — `react-draggable` (already a dependency; `DraggableModal` is the precedent). Fixed width, **no resize** (D17). Bounded to the viewport. Position kept in component state for the session only.
- **One player at a time**, mounted in the active slot (§5.3); the dialog is `destroyOnClose` so its player is gone while PiP is up. The launcher lives in `Flux101/index.tsx` via `dialog-controller`.
- **Pause on tab switch** — Electron: `TabEvents.TabBlurred` (already consumed in `pages/Beambox.tsx`); web: `visibilitychange`.
- **Lifecycle** — close stops playback; switching lessons reuses the player (`loadVideoById`) and seeks to that lesson's `resumeSec`.
- **Mobile** (≤ 600 px, `mixins.is-mobile`) — dialog mode only; no PiP (D17). The course body stacks: player and footer first, lesson list below, the whole body scrolls; the window takes the viewport height (`100dvh − 40px`) instead of the fixed 560 px. Same stylesheet serves the Welcome tab.

## 8. Requirements

**Entry & navigation**
- **R1a** Book icon in `DrawingToolButtonGroup` (below the separator, next to Beamy) with a remaining-lessons badge. Opens the course; is its collapsed home. Snapshot test updated.
- **R1b** Welcome page tab "FLUX 101" rendering the dashboard inline.
- **R1c** Help menu item `START_101_COURSE` → `showFlux101()` in the editor; on the Welcome page → `welcome` event `select-tab: 'flux-101'` (listened to in `pages/Welcome.tsx`).
- **R2a** One-time post-tutorial prompt on `showTutorial` resolve (`showFlux101Nudge` in `Flux101/index.tsx`, called from `beambox-init.ts`). Never shown again once answered (`nudgeDismissed`) or once the course is complete. Existing users whose tutorial was skipped long ago still get it once, on their first launch with this release.
- **R3** Dashboard lists chapters → lessons with status, progress meter, badges, credits, sync state, Continue CTA.
- **R3a** Lessons with `helpArticleId` show a grey hint + external-link icon → `browser.open(helpArticleUrl(id))`.
- **R3b** Lesson 2-1 shows "Not required for first-time use of beamo / beamo II" when the selected machine (fallback: workarea) is `fbm1`/`fbm2`.

**Player**
- **R4** Opening the course launches dialog mode at `lastLessonId` (or 1-1), seeked to `resumeSec`, paused until the user presses play.
- **R5** Minimize ⇄ Expand switches modes without reloading the video or losing position, lesson, or progress.
- **R5a** Close (either mode) stops playback and collapses to the book icon; no floating residue.
- **R6** PiP keeps the canvas and panels fully interactive; dialog mode is modal.
- **R7** Prev / Next follow course order; Mark done completes without watching.
- **R7a** One player instance at a time.
- **R7b** Playback pauses when the tab loses focus (Electron tab blur, web visibility).

**Progress & rewards**
- **R8** Track `playedSec` / `resumeSec` via the IFrame API; complete at ≥ 90 % played, `ENDED`, or Mark done. Monotonic.
- **R9** Non-blocking celebration on completion; auto-advance Continue; offer Next lesson.
- **R10** Chapter badge on chapter completion with a larger celebration.
- **R11** Certificate screen on 23/23. v1 is a screen only; "Save as image" ships when a design exists (D19).
- **R12** Rewards are deterministic.
- **R12a** Credit grant: on `watched` completion while logged in, call the grant endpoint (companion PRD) and set `creditGranted` on success. Failure never blocks completion or celebration; ungranted `watched` lessons retry on the next local write or login (`Flux101/sync.ts` `grant`, one request per quiet second, via `fluxId.grantFlux101Credits`). Credits UI needs no switch: the "+0.5" tag in the celebration and the "credits earned" count in the Welcome tab subtitle (next to N/23) render only from `creditGranted`, which only the server sets — so they are simply absent until the backend is deployed.

**Persistence & sync**
- **R13** Local persistence under storage key `beam-studio-101` via `storageStore` (cross-tab sync included). Add the key to `getStorageKeys()` and the `Storage` interface.
- **R14** When logged in, push the active bucket with `setPreference({ flux101_progress: bucket })` and hydrate with `getPreference('flux101_progress')` on login and app launch. Server key is `flux101_progress` (Python attribute naming; see companion PRD).
- **R15** Sync triggers: lesson completion events and login hydration only. No idle/poll-tick writes. Fail silently; retry opportunistically.
- **R16** Claim and merge per §9.

**Content & i18n**
- **R17** Catalog in-bundle with `version`.
- **R18** Chapter/lesson titles, badge names, and all copy under a new `flux_101` key in `lang/*.ts` (en + zh-tw first, all 23 before PR). Video audio stays English; show an "English audio" note.

**Account UX**
- **R19** Dashboard reflects "Synced ✓" vs "Sign in to save progress" with one-tap `FluxIdLogin`.
- **R19a** Claimed-bucket warning per §5.5, once per app session (D14).

## 8a. Must not change (regression contract)

Shared files outside `components/dialogs/Flux101/` that the implementation touches, and what their
existing callers must keep doing. Reviewers check this list against `git diff --stat`.

| Shared file | Change | Callers — expected behaviour |
|---|---|---|
| `constants/storageConstants.ts`, `interfaces/IStorage.d.ts` | add key `beam-studio-101` | `storageStore` init / `storage.getStore()` — all other keys unaffected |
| `lang/*.ts` (all 23), `interfaces/ILang.ts` | add `global.skip`, the `flux_101.*` block and `topbar.menu.flux_101` | every other lang consumer — untouched keys |
| `actions/beambox/menuActions.ts` | add `START_101_COURSE` (window in the editor, tab switch on Welcome via the `welcome` event emitter) | all other menu ids — unchanged handlers |
| `helpers/eventEmitterFactory.ts` | add the `welcome` channel | every other channel — unchanged |
| `styles/_variables.scss` | add `$reward-yellow` (credits tag tint; documented in the `styling` skill palette) | existing variables — unchanged |
| `pages/Welcome.module.scss` | add the `.flux-101` tab slot (`flex: 1; min-height: 0`) and `.book-icon` scale | other tab slots — unchanged |
| `TopBar/useMenuData.ts` | add Help item `START_101_COURSE` (not in `MENU_ITEMS`, so always enabled) | Help menu order: About, Start Tutorial, UI Intro, **FLUX 101**, …; attach/detach enable logic — unchanged |
| `apps/app/src/node/menu-manager.ts` | add the same Help item to the Electron template | native menu — other items unchanged |
| `apps/app/src/main.ts` `setReferer()` | filter adds `www.youtube.com` / `www.youtube-nocookie.com`, sets `Referer: https://flux3dp.com/` for them | flux-id requests — still get their own origin as Referer (unchanged branch) |
| `apps/app/src/node/tabManager.ts` `setWindowOpenHandler` | no child windows any more: every non-`file://` / `about:` target goes to `shell.openExternal` | `file://` still denied; `target="_blank"` links in alert strings (Help Center, `x-apple.systempreferences:`) now open in the system browser instead of an Electron window; FLUX ID OAuth unaffected (uses `browser.open` + `beam-studio://` deep link) |
| `public/js/lib/svg-nest/util/eval.js` | handler registered only inside a `WorkerGlobalScope` | svg-nest parallel workers (`new Worker('…/eval.js')`) — still eval posted code; Electron bootstrap (`requireConfig.js` loads it in the main window for load order) — no longer installs `window.onmessage` |
| `LeftPanel/components/DrawingToolButtonGroup.tsx` (+ `.spec.tsx`), `icons/left-panel/LeftPanelIcons.tsx` (+ `book.svg`) | add the FLUX 101 button (remaining-lesson badge) between the separator and Beamy; the spec mocks the `dialogs/Flux101` entry so `startFlux101Sync()` and its `dialog-caller` → `device-master` chain never load | every other tool button, order and ids — unchanged; snapshot `DrawingToolButtonGroup.spec.tsx.snap` is additive only |
| `pages/Welcome.tsx` (+ `Welcome.spec.tsx`) | add menu key `flux-101` after Help Center, content `welcome/TabFlux101.tsx` (embeds `Flux101/CourseBody`); the spec mocks the tab like every other tab | other tabs, default tab, recent-files loading — unchanged; snapshot `Welcome.spec.tsx.snap` is additive only |
| `helpers/api/flux-id/activity.ts` (+ `index.ts` default export) | add `grantFlux101Credits(lessonIds)` → `POST /api/beam-studio/flux101/grant`, resolves to the server's `granted_lesson_ids` or `undefined` | `getPreference` / `setPreference` / `submitRating` / `recordMachines` — unchanged |
| `actions/beambox/beambox-init.ts` `showStartUpDialogs` | `await showFlux101Nudge()` right after the tutorial block, gated by `!isMobile()` only (no machine connection needed, unlike the tutorial) | gesture tutorial, first calibration, tutorial prompt, changelog, path-engine dialog, announcements — same order; the nudge resolves at once when already answered or the course is complete |

Not touched: `actions/dialog-caller.tsx` (the launcher lives in `Flux101/index.tsx` via `dialog-controller`, the PrintAndCut pattern). Docs only: `.agents/skills/styling/SKILL.md` is a new skill (spacing scale, palette, 16:9 fit pattern) written during the SCSS cleanup; `AGENTS.md` carries no change from this branch.

## 9. Buckets, claim & merge

**Merge rule (per lesson, completion-biased):** `completed` beats non-completed; same status → higher `playedSec` (and higher `resumeSec`); ties → newer `updatedAt`. `creditGranted` is OR-ed. Badges / certificate are derived, so nothing to merge. Unknown lesson ids are kept (not deleted) to tolerate catalog rollbacks; new lessons appear not started.

**Login as user A:**
1. `A = merge(local[A], cloud[A], anonymous)`.
2. Write `A` to `local[A]`, push to cloud.
3. Mark `anonymous.claimedBy = A` and **mirror `A` into `anonymous`** (do not clear it), so a session expiry does not show an empty course.
4. Request grants for every `watched` lesson in `A` with `creditGranted !== true` (server is idempotent). The reply lists every lesson the account was ever granted: known lessons get `creditGranted`, and a granted lesson the local bucket has never seen is recorded as a `watched` completion with `playedSec: 0` — the grant is server truth and the local record follows it (decided 2026-10-05).

**Login as user B while `anonymous.claimedBy === A`:** `B = merge(local[B], cloud[B])`. The anonymous bucket is **not** merged into B; it belongs to A. The once-per-session warning (§5.5) is what tells B this before they watch.

**Logout / session expiry:** active bucket becomes `anonymous` (which mirrors the last claimer's progress). No cloud writes while logged out.

**Implementation:** pure merge/claim logic in `Flux101/progress.ts` (`adoptOnLogin`, `maskEmail`, `claimedByOther`, unit-tested); side effects in `Flux101/sync.ts` — `startFlux101Sync()` (run once from `Flux101/index.tsx`) listens to `fluxIDEvents 'update-user'`, pulls `bxpref/flux101_progress`, merges, pushes the whole bucket after every local write (5 s quiet-period debounce), and `warnIfClaimed()` shows the §5.5 alert once per session. Until the backend column exists the pull answers `INVALID_KEY` and everything stays local-only.

**Catalog version drift:** progress matches by stable lesson id; chapter/course completion is recomputed against the current catalog.

## 10. UX / visual notes

- Lazy-load the IFrame API and mount one iframe only when a lesson opens; never 23 iframes.
- antd + existing dialog patterns; match `MediaTutorial.tsx` conventions where sensible.
- Reduced-motion: `helpers/confetti.ts` already no-ops; celebration falls back to a static check.
- Keyboard-operable controls; PiP nudgeable via arrow keys.
- Tone: encouraging, never punishing. Mark done and skipping ahead are first-class.

## 11. Success metrics

- Course opened by ≥ 40 % of new users in the first session; % completing ≥ 1 lesson; % reaching 23/23.
- Watch-and-do: % of lesson views with PiP minimized *and* canvas edits during playback.
- Sync health: % of logged-in users with cloud progress; merge error rate ≈ 0.
- Activation: do completers reach first `SEND_FILE` faster?
- Credit cost: grants × 0.5 vs. retention lift; abnormal grant velocity as a farming signal.

## 12. Rollout

One release, no feature flag (D22 struck), dogfooded through the existing alpha → beta → stable channels. Credits UI is self-gating (renders from server-confirmed `creditGranted` only), so no switch is needed while the flux-id endpoint rolls out. The former Phase 0–2 split is collapsed; "Phase 3" items (CMS-fed catalog, localized video, deep-links) remain future work.

## 13. Edge cases & risks

- **YouTube blocked / video removed** → inline error + "Open on YouTube"; dead ids need a patch release until the catalog is CMS-fed.
- **Two Electron tabs with the course open** → each tab has its own player; tab blur pauses the inactive one (R7b). Not otherwise coordinated in v1.
- **Concurrent progress on two devices** → completion-biased merge; a lesson may re-show as in-progress, never lost.
- **Credit farming** → server-idempotent per (user, lesson), `watched`-only, capped at 11.5/user by construction. The client cannot prove watching and the endpoint is discoverable (public repo); accepted exposure, see companion PRD §4 and the meeting items in D20.
- **Anonymous bucket claimed by A, used by B** → warned once per session; B's watching still lands in the anonymous bucket and will be picked up by A. Accepted.
- **Low-end machines** → single iframe; no polling while paused.
- **English-only curriculum** → Help Center companion links per lesson; localized content is future work.

## 14. Decisions

- **D1** Recommended-linear, not hard-locked.
- **D2** Progress lives in `storage` (`beam-studio-101`) + FLUX ID `bxpref`, not `BeamboxPreference`.
- **D3** Sync reuses `bxpref`; **but** the server model needs a `flux101_progress` JSON column (companion PRD). Credit granting needs a new endpoint.
- **D5** 0.5 FLUX+ credits per `watched` lesson, once, server-authoritative (client constant `CREDITS_PER_LESSON` in `catalog.ts` is display-only). Context: a new FLUX ID account starts with 10 one-time credits and machine linking grants 10, so 11.5 for the full course is in the same band.
- **D6** Catalog finalized as §6.1.1.
- **D7** `marked_done` earns no credit.
- **D8** Name FLUX 101; internal key `beam-studio-101`.
- **D9** Entries: book icon, Welcome tab, Help menu; one post-tutorial nudge.
- **D10** Machine-conditional note for 2-1 only.

Added 2026-09-18 (engineering review):
- **D11** Store source data only; derive XP / credits / badges / certificate.
- **D12** Keep the Help Center link per lesson (grey hint + external link, now `helpArticleId` + locale-aware URL); drop `relatedFeature`.
- **D13** 2-1 note is a hardcoded special case, not a generic notes structure.
- **D14** Per-owner buckets with `claimedBy`; mirror on claim; other users never inherit a claimed bucket; once-per-session warning with masked email.
- **D15** No autoplay; user presses play.
- **D16** Adopt the IFrame API: resume, pause on tab blur, played-seconds threshold.
- **D17** PiP via `react-draggable`, fixed size, session-only position, no mobile PiP.
- **D18** Drop the per-app-open "continue learning" notification (v1 R2b).
- **D19** Certificate v1 is a screen; image export waits for a design. Draft layout attached in ClickUp.
- **D20** **Meeting items:** XP (likely cut — no use for it), certificate design ownership, credit abuse handling (device id / IP, multi-account, public endpoint).
- **D21** Machine note source: `deviceMaster.currentDevice` first, then workarea.
- ~~**D22** Feature flag via Experimental settings~~ — struck 2026-10-05: the feature is additive UI (entries, a dialog, a start-up nudge), never touches the canvas or job output, and sync degrades silently while the backend column is missing. The Experimental category is also dev-only (`isDev()`), so a flag there would have blocked alpha/beta dogfooding, and the Electron native Help item could not be gated anyway. The credits UI needs no switch either: it renders only from server-confirmed `creditGranted`, so it is simply absent until the flux-id endpoint deploys (§12).
- **D23** (2026-09-30) Bucket key is the lower-cased FLUX ID email, not a uid (`IUser` only guarantees `email`, and the masked-email prompt needs it anyway). `nudgeDismissedAt` timestamp replaced by a `nudgeDismissed: true` flag — nothing re-prompts on a schedule. `marked_done` upgrades to `watched` if the user later plays ≥ 90 %; never the reverse.
- **D24** (2026-10-02) Dropped the single `position: fixed` iframe laid over the active slot (the mockup technique). It needed a `z-index` above every antd modal, so dialogs opened later (e.g. machine info) rendered *under* the video, and it had already caused the Electron black-player stacking bug and would need scroll tracking for the Welcome embed. The player now lives in the slot; dialog ⇄ PiP remounts it and `useYouTubePlayer` autoplays only when the video was playing at the moment of the switch (`wasPlaying`, reset on close).

## 15. Appendix: key references

- Scripted tutorial — `app/components/tutorials/*`, `app/constants/tutorial-constants.tsx`.
- Startup gating — `app/actions/beambox/beambox-init.ts` (`showStartUpDialogs`, `showTutorial`), `helpers/api/alert-config.ts`.
- FLUX ID — `helpers/api/flux-id/base.ts`, `helpers/api/flux-id/activity.ts`, `dialogs/FluxIdLogin.tsx`.
- Persistence — `app/stores/storageStore.ts`, `app/constants/storageConstants.ts`, `interfaces/IStorage.ts`.
- Entry surfaces — `app/pages/Welcome.tsx`, `LeftPanel/components/DrawingToolButtonGroup.tsx`, `icons/left-panel/LeftPanelIcons.tsx`, `TopBar/useMenuData.ts`, `app/actions/dialog-caller.tsx`.
- Primitives — `app/widgets/DraggableModal.tsx`, `helpers/confetti.ts`, `components/Chat/index.tsx` (iframe precedent).
- Machine context — `helpers/device-master.ts` (`currentDevice`), `app/stores/documentStore.ts`, `app/constants/workarea-constants.ts`.
- Tab events — `app/constants/ipcEvents.ts` (`TabEvents.TabBlurred`).
- Curriculum — YouTube playlist `PL97IZXQ17KZ8WhfmCDFn0ZBLRYkWAQRXu`; Help Center 101 articles (URLs to be collected).
