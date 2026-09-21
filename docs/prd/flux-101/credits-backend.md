# PRD: FLUX 101 — flux-id backend (progress sync + credit grant)

| | |
|---|---|
| **Status** | Draft |
| **Created** | 2026-09-18 |
| **Owner** | flux-id repo (`../flux-id`, Django / DRF) |
| **Companion of** | [FLUX 101 — Gamified Beginner Course](flux-101.md) (Beam Studio client; owns the UX and the client-side contract in its R12a / R14 / §9) |
| **Tracking** | ClickUp <https://app.clickup.com/t/5719332/86ey3weh9> |
| **Branching note** | flux-id is currently on `feat/material-catalog` with uncommitted edits to `fluxid/apps/beam_studio/{admin.py, models/__init__.py, urls.py, constants.py}`. This work **branches from `main`** and touches the same files, so expect a rebase once material-catalog merges. |

---

## 1. Summary

Two small, independent backend changes so the Beam Studio FLUX 101 course can (a) sync per-user progress and (b) reward completed lessons:

1. **Progress sync** — add a JSON column to `BeamStudioPreference` so the existing `bxpref` endpoint accepts a `flux101_progress` key. No new endpoint.
2. **Credit grant** — one idempotent endpoint that grants **0.5 one-time credits** per `(user, lesson_id)` exactly once, using the existing `add_onetime_credits` helper and a new grant-record table.

Everything else (thresholds, celebration, badges) is client-side.

## 2. Progress sync: `flux101_progress` column

### Why a column
`BXPref` (`fluxid/apps/software_preference/views.py`) is **not** a key/value store: `update_from_dict` does `hasattr(self, key)` and silently ignores unknown keys, and `get` returns `INVALID_KEY`. The client PRD's v1 assumption ("no backend change needed") was wrong. The precedent column is `did_gesture_tutorial`.

### Change
`fluxid/apps/software_preference/models.py`:

```python
flux101_progress = models.JSONField(default=dict, blank=True)
```

- Add it to `get_dict()`; `update_from_dict` already handles it via `setattr`.
- Migration.
- Admin: show as a read-only JSON widget (optional).

### Contract
- Client calls `POST software-preference/bxpref` with `{ "flux101_progress": <bucket> }` and `GET software-preference/bxpref/flux101_progress` → `{ "status": "ok", "value": <bucket> }`.
- The value is the client's **user bucket** (not the whole local map of buckets). Shape is owned by the client PRD §6.2; the server treats it as opaque JSON.
- Size guard: reject bodies where `flux101_progress` serializes to more than **16 KB** (23 lessons × a few fields is < 4 KB; this only stops abuse). Return the existing error-response shape with `info='INVALID_VALUE'`.
- Last-write-wins on the server; the client does the completion-biased merge before pushing.

## 3. Credit grant endpoint

### Model
New in `fluxid/apps/beam_studio/models/flux101.py` (register in `models/__init__.py`):

```python
class Flux101LessonGrant(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='flux101_grants')
    lesson_id = models.CharField(max_length=8)          # '1-1' … '5-3'
    credits = models.DecimalField(max_digits=4, decimal_places=2)  # amount actually granted, for audit
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'lesson_id')
```

The `unique_together` constraint **is** the idempotency guarantee; use `get_or_create` inside `transaction.atomic()` so a concurrent double-submit cannot grant twice.

### Constants
`fluxid/apps/beam_studio/constants.py` (file already exists on the material-catalog branch; add, don't replace):

```python
FLUX101_LESSON_IDS = frozenset({'1-1','1-2','1-3','2-1','2-2','2-3','2-4','3-1','3-2','3-3','3-4','3-5','3-6',
                                '4-1','4-2','4-3','4-4','4-5','4-6','4-7','5-1','5-2','5-3'})
FLUX101_CREDITS_PER_LESSON = Decimal('0.5')
```

The id list bounds exposure to 23 × 0.5 = 11.5 credits per user by construction. Amount is a server constant so it can be tuned without a client release.

### Endpoint
`POST api/beam-studio/flux101/grant` — `fluxid/apps/beam_studio/views/flux101.py`, wired in `beam_studio/urls.py`.

- Auth: same as `BXPref` — `authentication_classes = csrf_exempt_auth_classes` + `check_user_login_and_valid(user)`.
- Request: `{ "lesson_ids": ["2-4"] }` — a list, so the client can back-grant several lessons in one call after a login/claim (client PRD §9 step 4). Cap the list at 23; reject longer with `INVALID_VALUE`.
- Behaviour per id:
  - not in `FLUX101_LESSON_IDS` → reported as `"invalid"`, nothing granted, other ids still processed;
  - `get_or_create(user, lesson_id)`; on create → `add_onetime_credits(user, FLUX101_CREDITS_PER_LESSON, note=f'FLUX 101: {lesson_id}')` (existing helper in `fluxid/apps/user/utils.py`, writes a `UserPointTransaction`) → `"granted"`;
  - already exists → `"already_granted"`.
- Response:

```json
{
  "status": "ok",
  "results": { "2-4": "granted", "2-3": "already_granted", "9-9": "invalid" },
  "granted_lesson_ids": ["2-4", "2-3"],
  "credits_per_lesson": "0.50"
}
```

`granted_lesson_ids` is the full set of lessons this user has ever been granted (not just this call), so the client can set `creditGranted` on all of them after a fresh login.

- Logged out → the standard `check_user_login_and_valid` error response.

### Admin
Register `Flux101LessonGrant` in `beam_studio/admin.py` as a read-only list (user email, lesson, credits, created_at) with search by email. This is the audit surface for "abnormal grant velocity".

### Tests
`fluxid/apps/beam_studio/tests/test_flux101.py`, following the existing test module pattern:
- grants once and returns `granted`; second call returns `already_granted` and the user's `onetime_credits` rose by exactly 0.5;
- invalid id is reported and grants nothing;
- logged-out request is rejected;
- `flux101_progress` round-trips through `bxpref` and oversize payload is rejected.

## 4. Abuse & exposure (for the meeting — see client PRD D20)

- The server cannot verify watching; it only guarantees once-per-(user, lesson). Max exposure 11.5 credits per account. For scale: a new account already starts with 10 one-time credits, machine linking grants 10, registration 40.
- Beam Studio is a public repo, so the endpoint and payload are discoverable; anyone can script all 23 grants. Countermeasures (HMAC of a server-issued nonce, minimum wall-clock between grants, requiring a linked machine) are possible but likely not worth it at this exposure. **Decision needed.**
- Multi-account farming yields 11.5 per account, less than the 10 + 40 an account gets for registering and linking a machine; not a new incentive.
- Device id / IP logging: optional `X-Device-Id` header stored on the grant row for later analysis. Cheap to add, no enforcement in v1. **Decision needed.**
- Rate limit: reuse whatever throttle the AI image endpoints use, if any, at e.g. 30 grant calls / hour / user.

## 5. Open questions

- Does `credits_per_lesson` need to be exposed anywhere else (e.g. member center transaction labels)? The `UserPointTransaction.note` `"FLUX 101: 2-4"` may be enough.
- Should completing the whole course grant a bonus (certificate)? Client PRD says no; keeping the server to per-lesson only.
- Whether to store the `X-Device-Id` (§4).
