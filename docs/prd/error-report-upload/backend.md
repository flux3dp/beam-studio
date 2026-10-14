# PRD: Error Report Upload — flux-id backend (endpoint, storage alias, folder cap)

| | |
|---|---|
| **Status** | Draft — 2026-10-06 |
| **Created** | 2026-10-06 |
| **Owner** | flux-id repo (`../flux-id`, Django 4.2.27 / DRF 3.16 / gunicorn 23 / celery 5.6) |
| **Companion of** | [Error Report Upload](error-report-upload.md) (Beam Studio client; owns the UX, consent, scrub, throttle and cooldown, and the request contract in its §7.5 / §8) |
| **Tracking** | ClickUp: TBD (same task as the client PRD) |
| **Related code (flux-id)** | `fluxid/common/storage.py` (`S3Boto3Storage` subclass pattern), `fluxid/settings.py:377-392` (AWS creds, `AWS_S3_ENDPOINT_URL`), `fluxid/apps/beam_studio/views/flux101.py` (`csrf_exempt_auth_classes`, throttle class pattern), `nginx/site.conf.template:23` (`client_max_body_size 32M`), `nginx/gunicorn.conf.py` (sync workers `2 × cpu + 1`), `compose.deploy.yml` |

---

## 1. Summary

One unauthenticated DRF endpoint receives a diagnostic bundle from Beam Studio, validates it, writes it to a Django storage alias backed by Cloudflare R2, dedupes repeats, and keeps each device folder under a size cap. Storage provider is a settings entry. Retention is an R2 lifecycle rule. Impact on the shared Linode box is measured per the client PRD §9.2.

## 2. Endpoint

`POST /api/beam-studio/error-report` — `APIView`, `authentication_classes = csrf_exempt_auth_classes`, `permission_classes = (AllowAny,)`, two `AnonRateThrottle` classes, scopes `error_report_hour = '6/hour'` and `error_report_day = '20/day'` (§6).

Multipart fields (all strings unless noted):

| Field | Rule |
|---|---|
| `serial` | `^[A-Za-z0-9-]{1,32}$` or `none`. Deliberately not length-pinned: today's serials are typically 10 chars but the format is not guaranteed stable, and length is not a security control anyway (an attacker matches any format). The factory list in §2.1 is the control. |
| `installation_id` | `^[a-f0-9]{64}$` (sha256) or UUID v4; always required (folder key for the no-machine sites, §2.1) |
| `error_code` | ≤ 64 chars, `^[#A-Za-z0-9_-]+$`; `#` is stripped before the key and the log line (`#806` is stored as `806`) because it would start a URL fragment in any pasted object link (decided 2026-10-14) |
| `app_version`, `os`, `firmware_version` | ≤ 32 chars each; `firmware_version` may be empty |
| `occurrences_since_last` | integer ≥ 0 |
| `bug_report` | file, required, ≤ 10 MB |
| `system_log` | file, optional, ≤ 10 MB |
| `scene` | file, optional (only `#806` / `#809`), ≤ 10 MB |

### 2.1 Serial handling (no verification tier)

`serial` is attacker-controlled on a public API, and flux-id's serial tables (`MachineInfo`, `MachineDetail`) cover too few machines in the field to make a verified/unverified split useful (decided 2026-10-08, see §10 B3 history). The view therefore trusts the serial only as a folder name: `{serial}/` when a device was known, `no-device/{installation_id}/` for the three client sites that have no machine at all (`#802` backend start, `#809` import, QR auto-connect). Fabricated serials are bounded by the per-IP throttles and the global byte budget (§6), not by a list. Serial format is validated loosely and not length-pinned (§2).

Whole body ≤ `ERROR_REPORT_MAX_BODY_BYTES` (20 MB; nginx already caps at 32 MB). Any violation → `400 { status: 'error', reason }` and a log line `error_report rejected reason=<reason>`. Unknown fields are ignored. Content types from the client are ignored; objects are stored as `text/plain` (`.txt`) and `image/svg+xml` (`.svg`).

Responses: `200 { status: 'ok' }`, `200 { status: 'duplicate' }` (§5), `400`, `429` (throttle), `503` if the storage write fails (client retries up to 3×).

## 3. Storage

```python
# settings.py
STORAGES['error_report'] = {
    'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
    'OPTIONS': {
        'bucket_name': os.environ.get('R2_BUCKET', 'flux-id-test'),   # settings_deploy: 'flux-id'
        'location': 'error-report',                                  # one private bucket, one folder per feature
        'endpoint_url': os.environ['R2_ENDPOINT_URL'],      # https://<account>.r2.cloudflarestorage.com
        'access_key': os.environ['R2_ACCESS_KEY_ID'],
        'secret_key': os.environ['R2_SECRET_ACCESS_KEY'],
        'region_name': 'auto',
        'default_acl': 'private',
        'object_parameters': {},  # the global AWS_S3_OBJECT_PARAMETERS sets StorageClass=INTELLIGENT_TIERING; R2 accepts STANDARD only (InvalidStorageClass otherwise)
        'querystring_auth': False,
    },
}
ERROR_REPORT_FOLDER_CAP_BYTES = 20 * 1024 * 1024
ERROR_REPORT_MAX_BODY_BYTES = 20 * 1024 * 1024
ERROR_REPORT_DEDUPE_WINDOW = timedelta(hours=24)
ERROR_REPORT_DAILY_BYTES_BUDGET = 2 * 1024 ** 3   # global ingest cap per UTC day, §6
```

Buckets are split by access class and environment, never by feature: `flux-id` and `flux-id-test` hold every private feature under its own `location` prefix (decided 2026-10-14, so the bucket count stays at two; a `flux-id-public` pair appears only when a feature needs public URLs, since public access is a per-bucket switch). Lifecycle rules take a prefix, so retention still differs per feature. The S3 fast path in `list_folder` prepends `storage.location` itself; `save` and `delete` get it from django-storages.

The view touches storage only through `storages['error_report']` (`save`, `listdir`/`bucket.objects.filter`, `delete`). **Changing provider = changing this dict**: S3, Backblaze B2, GCS (S3-interop) and MinIO need only new `endpoint_url` / keys; Google Drive would be a custom `Storage` subclass behind the same alias with its own cleanup cron, since Drive has no lifecycle rules.

Key layout under the `error-report/` prefix (ISO-8601 UTC timestamp first, colon-free, so lexicographic order = chronological order; `{code}` is the client's `error_code` without `#`):

```
error-report/{serial}/{ts}_{code}_bug_report.txt
error-report/{serial}/{ts}_{code}_system_log.txt
error-report/{serial}/{ts}_{code}_scene.svg
error-report/no-device/{installation_id}/{ts}_{code}_bug_report.txt   # the three no-machine sites (§2.1)
```

Retention: R2 object lifecycle rule scoped to prefix `error-report/`, delete after 180 days. Set once in the Cloudflare dashboard (or `wrangler r2 bucket lifecycle add`). No cron.

## 4. Folder cap (eviction)

Per folder (`{serial}/` or `no-device/{installation_id}/`), total bytes ≤ `ERROR_REPORT_FOLDER_CAP_BYTES`.

Algorithm, run once per upload before the write:

1. `objs = list(prefix)` — one `ListObjectsV2` call (paginated at 1000 keys; realistic folders hold < 30). Keys come back already sorted oldest-first because of the timestamp prefix. Each entry carries `Size`, so no extra HEAD calls.
2. `total = sum(sizes)`; `incoming = sum(uploaded file sizes)`.
3. While `total + incoming > cap` and `objs` non-empty: take the oldest **upload group** (all keys sharing the same `{ts}_{code}` prefix), move them to `to_delete`, subtract their sizes.
4. If `to_delete`: one `DeleteObjects` batch call (≤ 1000 keys), log line `error_report evicted folder=… groups=…`.
5. If `incoming > cap` on its own (impossible under the 10 MB per-file rule, but checked): reject `400 too_large` instead of emptying the folder.
6. Write the new objects.

Cost: the listing in step 1 is the **same call** the dedupe in §5 needs, so the cap adds at most one `DeleteObjects` call. Round-trip Linode → R2 is ~50–150 ms per call; worst case per upload is two calls plus the PUTs. R2 billing: Class B list $0.36/M, Class A delete $4.50/M, both negligible at hundreds of uploads a day.

Why it is fast: no sorting, no size probing, no per-file deletes. The timestamp-first key is what makes "oldest" free. The 10 MB per-report client truncation bounds how many groups one upload can evict (at 20 MB cap, at most ~2–4).

Adjusting: the cap, body limit and dedupe window are settings; raising the cap needs no migration or re-layout.

## 5. Dedupe

Backstop for a client whose cooldown map was wiped. Using the listing from §4: if any key in the folder has the same `{code}` and a `{ts}` within `ERROR_REPORT_DEDUPE_WINDOW`, respond `200 { status: 'duplicate' }`, store nothing, log line `error_report duplicate …`. The client treats `duplicate` as sent for its throttle and cooldown, without the "sent" toast.

## 6. Spam / abuse and the storage bound

Threat model: an attacker who has read the client source can post arbitrary `serial` / `installation_id` values, so the per-folder cap (§4) bounds one folder, not the bucket. Per-IP limits bound one IP, not a botnet. The only hard bound on storage regardless of IP count or fabricated serials is the **global daily byte budget**, so it exists from day 1.

| Layer | Rule | What it bounds |
|---|---|---|
| 1. Cloudflare WAF rate-limit rule on `/api/beam-studio/error-report` | 10 req / 10 min per IP, action block, mitigation 10 min (needs a Business zone; Pro allows at most a 1 min period, Free only 10 s: use 5 / min or 3 / 10 s there); expression `http.request.uri.path eq "/api/beam-studio/error-report" and http.request.method eq "POST"`; answers before nginx reads the body | request rate per IP, cheaply |
| 2. DRF per-IP throttles (`AnonRateThrottle`, two scopes, redis-backed) | `error_report_hour = '6/hour'` and `error_report_day = '20/day'` | an honest NAT (workshop with several machines, each on cooldown) stays well under 20/day; a single abusive IP is capped at 20 × 20 MB = 400 MB/day |
| 3. **Global daily byte budget** | `cache.incr(f'error_report:bytes:{utc date}', body_size)` before the write; over budget → `429 { status: 'budget' }`, nothing stored, log line `error_report rejected reason=budget` | total ingest ≤ 2 GB/day → bucket ≤ 2 GB × 180 d = 360 GB worst case (≈ $5/month on R2); honest traffic (≈ 45 GB/month) never touches it |
| 4. Per-folder cap (§4) and 24 h dedupe (§5) | 20 MB per serial / installation folder | one spoofed id cannot grow a folder past 20 MB |
| 5. Client-side daily limit and fingerprint cooldown (client PRD §7.7) | 10/serial/day, exponential cooldown | honest volume |

Alerting: a Cloudflare notification on R2 storage crossing 100 GB; `grep 'reason=budget'` over the gunicorn error log in the weekly readout (honest traffic never produces it, so any hit means abuse or a client bug). flux-id has no metrics or alerting pipeline today, see §7.

The client treats `429 budget` like any other 4xx: no retry (only no-response and 5xx retry), silent. It does not count as sent, so the cooldown does not advance and the report is retried on the next occurrence.

Escalation only if abuse is observed: require a Beam Studio `User-Agent` prefix, a Turnstile token, or, once the serial tables are fuller, a verified/unverified split with a small budget for unknown serials (the design that was dropped in §10 B3).

## 7. Performance

**Metrics source.** flux-id's statsd integration (`StatsdMiddleWare`, `statsd.incr` in login / openai / design_market, added 2021-11-02 in #46) has never had a receiver: `STATSD_HOST` is unset, nothing listens on 8125 in `compose.deploy.yml`, and python-statsd then sends UDP to localhost where it is dropped. The receiver was a separate EC2 that was not migrated to Linode. Decided 2026-10-12: leave the dead integration in place until this feature ships, then decide whether to remove it or add a receiver. So this feature does not use it. Instead: one structured log line per request from the view (`error_report <ok|duplicate|rejected> serial=… code=… bytes=… ms=… reason=…`, Django logging → gunicorn error log) plus the gunicorn access log with request time (`nginx/gunicorn.conf.py` currently has `accesslog = None`; PR 6 enables it with `access_log_format` including `%(M)s`). The §9.2 readout is `awk` over those two logs plus Cloudflare analytics and Linode graphs. Counts (uploads, duplicates, rejects, budget hits, bytes, summed request time) are also kept per UTC day and error code in `ErrorReportDailyStat` rows, bumped from the view; the Celery beat task `error_report_daily_digest` posts yesterday's sums to the Beam Studio Slack channel, and the budget / storage-failure alerts go to the flux-id channel. The rows give totals and averages only; per-request reasons and p50 / p95 come from the log lines.

Sync write inside the request holds one of the 9 gunicorn workers for the R2 PUT (~1–3 s for 10 MB). nginx buffers the request body first, so slow client links do not hold workers. Measure per client PRD §9.2 (baseline week → burst replay on staging → week after release). Upgrade paths, in order of effort:

1. Save to a local temp file, push to R2 from a celery task (`compose.deploy.yml` already runs `celery-worker`). Request returns in milliseconds; contract unchanged.
2. Presigned R2 PUT URL issued by the endpoint; bytes bypass Linode entirely. Adds one client round-trip; v2.

Linode outbound transfer counts the R2 PUTs (≈ 45 GB/month in the pessimistic model); check the plan's transfer pool.

## 8. Must not change

- `fluxid/common/storage.py` `FluxidS3Storage` and every existing `AWS_STORAGE_BUCKET_NAME` consumer (`design_market/storage.py`, ckeditor uploads) — untouched; the new alias is additive.
- `fluxid/settings.py` AWS credentials — unchanged; R2 uses separate env vars.
- `fluxid/apps/beam_studio/urls.py` — additive route only; existing flux101 routes and their throttle scope untouched.
- `fluxid/middleware.py` — untouched. `StatsdMiddleWare` is dead code (verified 2026-10-12: `STATSD_HOST` unset, no receiver in `compose.deploy.yml`, UDP to localhost dropped); this feature does not add to it.

## 9. Rollout

1. Settings alias + env vars on staging; create the R2 buckets `flux-id-test` and `flux-id`, one API token per bucket (Object Read & Write, scoped to that bucket), lifecycle rule on prefix `error-report/`. Done in code 2026-10-14 (branch `feat/error-report-upload`); buckets pending.
2. View + throttles + budget + tests (`tests/error_report.py`: validation table incl. 10-char and non-10-char serials both accepted, duplicate, eviction order on `InMemoryStorage`, cap setting, per-IP 429 keyed on the Cloudflare-appended client address (`REST_FRAMEWORK['NUM_PROXIES'] = 2`: Cloudflare and nginx each append one hop to `X-Forwarded-For`; without it DRF keyed on the whole header, which changes per edge node), budget 429 at the boundary and reset at UTC midnight, 503 on storage failure, S3 listing with the location prefix). Done 2026-10-14, 16 tests. The view's logger is pinned to INFO in `logging_generator` because the root logger sits at WARNING and would drop the §7 lines.
3. Cloudflare WAF rule on the path (plan-dependent period, see §6); R2 storage notification at 100 GB on the bucket.
4. Baseline week of metrics; ship; week-after readout into client PRD §9.2.

## 10. Open decisions

1. **B1** Should `occurrences_since_last` and `fingerprint` also be written to a small DB table for reporting, or is object metadata plus the R2 dashboard enough for v1? Default: metadata only.
2. **B2** Remote-adjustable client daily limit (source PRD §6 note): expose `ERROR_REPORT_DAILY_LIMIT` via the existing beam-studio config endpoint, or leave it a client constant? Default: client constant for v1.
3. ~~B3 Serial verification tier.~~ Proposed 2026-10-08 (route serials absent from `MachineInfo` / `MachineDetail` to an `unverified/` folder with a 300 MB/day budget), dropped the same day: too few field machines are in those tables, so the split would have had little discriminating power while costing an index migration and a second budget. Revisit only if abuse is observed and the tables are backfilled.
