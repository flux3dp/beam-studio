# Material Catalog API — Client/Server Contract (v1)

| | |
|---|---|
| **Status** | Draft — authored by the Beam Studio (client) side; flux-id backend implements to match |
| **Client types** | `packages/core/src/web/interfaces/IMaterial.d.ts` (source of truth for shapes) |
| **Shared fixture** | `docs/material-catalog-example.json` (both repos test against it) |
| **Related PRD** | `material-browser.md` (Material Browser PRD) |

The Material Browser sources its catalog from three layers, all sharing **one schema**:

1. **Bundled offline snapshot** — built inside Beam Studio from `presets.ts` at runtime, `version: 0`. Always available; the permanent offline fallback.
2. **FLUX Cloud catalog** — this API. Cached in memory by the client; any `version >= 1` supersedes the bundled snapshot.
3. **User content** — local only, never sent to or received from this API.

## 1. Endpoint

```
GET {FLUXID_HOST}/api/beam-studio/material-catalog/
```

- `FLUXID_HOST` = `https://id.flux3dp.com` (same axios client as banners/announcements).
- **No authentication** in v1 (public read-only, like `/api/beam-studio/banners`). Future region-gated or account-bound packs may add auth; the client already sends cookies when logged in.
- Failures are silent client-side (fall back to cache/bundle); do not treat this endpoint as availability-critical.

### Query parameters

| Param | Type | Required | Meaning |
|---|---|---|---|
| `version` | int | no | The catalog version the client currently holds (0 = bundled only). If the server's current version is not newer, it MAY respond with the short-circuit body (§2.2) instead of the full payload. |
| `region` | string | no | `us` \| `eu` \| `tw` \| `jp` \| `global`. Hint only — **v1 servers SHOULD return the full catalog** and let the client filter by each material's `regions` array. (Server-side pre-filtering is a future optimization; if implemented, `global` materials must always be included.) |
| `locale` | string | no | BCP-47-ish hint (Beam Studio `active-lang` code, §4). Hint only — v1 servers return full `LocalizedString` objects regardless, so the client can switch languages without refetching. |

## 2. Response

### 2.1 Full payload

`200 OK`, `application/json`, **camelCase keys**. Body is exactly the `MaterialCatalog` interface:

```jsonc
{
  "version": 3,                       // monotonic int, bumped on every publish
  "publishedAt": "2026-08-07T04:00:00Z",
  "materials": [ /* Material[] — see §3 */ ]
}
```

Response envelope note: unlike other beam-studio endpoints there is **no `{"status": "ok"}` wrapper** — the body IS the catalog document (it doubles as the bundled snapshot file format). Errors use plain HTTP status codes.

**Ordering**: array order is display order, server-controlled (admin `position` field) — for both `materials` and each material's `presets`. Clients render in payload order; user content is appended after catalog content.

**`publishedAt` before the first publish**: version 0 with `"1970-01-01T00:00:00Z"` is a valid sentinel (clients holding version 0 short-circuit anyway).

### 2.2 Up-to-date short-circuit (optional)

When `?version=` equals or exceeds the server's current version:

```json
{ "upToDate": true, "version": 3 }
```

The client treats any body without a `materials` array as "keep what you have". A server that always returns the full payload is also compliant — the client compares `version` itself.

## 3. Schema

Field-by-field. Optional = key may be absent (never `null` — omit instead).

### 3.1 `Material`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Stable, unique, immutable once published. Slug-like (`glitter-acrylic-us`). |
| `name` | LocalizedString | ✓ (cloud) | §4. (Client-bundled materials use `nameKey` instead; the server always sends `name`.) |
| `category` | string | ✓ | One of `wood` `acrylic` `leather` `metal` `plastic` `paper` `glass` `stone` `rubber` `other`. Fixed set — reject anything else in admin. |
| `image` | string (URL) | – | Absolute HTTPS URL to the hero photo (§5). Omit if none. |
| `coverColor` | string | – | `#rrggbb` hex; used as the card cover when there is no `image`. |
| `tags` | string[] | – | Short display chips, searchable. Localization of tags is NOT supported in v1 — use language-neutral tags or English. |
| `variants` | MaterialVariant[] | – | Thickness variants shown in the detail view's switcher. A variant is NOT a material — it only carries `{ id, thicknessUnit, thicknessNum, thicknessDen?, image? }` (identity/category/tags come from the material). One level only; variant `id`s are stable and referenced by `MaterialPreset.variantId`. **ALL thickness lives on variants** — a single-thickness material (e.g. 1 mm denim) has exactly one variant; a material without variants has no meaningful thickness (the client hides the badge). `thicknessUnit` is `mm` or `inch`, the variant's ONE authoritative unit — the client displays it verbatim, never converting. `thicknessNum`/`thicknessDen` store the marketed fraction exactly (⅛″ → num 1, den 8; 5/64″ → num 5, den 64; den defaults to 1) and render as typographic fractions without rounding. |
| `shopLinks` | object | – | Per-region map: `{ "us": url, "eu": url, "tw": url, "jp": url }` (any subset). The client shows "Buy on FLUX Shop" only when the viewer's active region has an entry. Never editable by end users. |
| `regions` | string[] | – | Visibility gate: subset of `global` `us` `eu` `tw` `jp`. Absent ⇒ `["global"]` (visible everywhere). A material listing `global` is visible everywhere regardless of other entries. |
| `description` | LocalizedString | – | Detail-view paragraph. |
| `presets` | MaterialPreset[] | ✓ | May be empty for a just-published material, but ≥1 expected for anything usable. |

### 3.2 `MaterialPreset`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | **Stable and immutable forever.** The client stores user edits ("Customized") and Restore targets keyed by this id — renaming/re-creating a preset with a new id orphans user customizations. Enforce immutability in admin (read-only after creation). |
| `legacyKey` | string | – | For presets migrated from Beam Studio's built-in `presets.ts` (e.g. `wood_3mm_cutting`): the original key, verbatim. The client writes it into legacy files for backward compatibility and uses it for tutorial hooks. Preserve exactly; never rename. |
| `name` | LocalizedString | ✓ (cloud) | e.g. "Cutting", "Engraving". Don't encode DPI in the name — presets whose `settings` declare a `dpi` get a DPI tag in the browser UI, so same-named entries (e.g. a base and a quality tier) are told apart by that tag. |
| `origin` | string | ✓ | Always `default` from this API (`user` is client-side only). |
| `settings` | object | ✓ | Nested parameter scopes — see §3.3. |
| `variantId` | string | – | Scopes the preset to one of the material's `variants` (e.g. a 3 mm cutting preset). Absent = applies to the whole material (thickness-agnostic engraving/printing). Must reference an id in the same material's `variants`. |

### 3.3 `settings` — machine/module scoping

```jsonc
"settings": {
  "<machineModel>": {          // PresetModel key, or "*" = any model
    "<layerModule>": {         // LayerModule numeric id as a STRING key, or "*" = any module
      "power": 55, "speed": 600, "repeat": 1, "dpi": "medium",
      "dpiOverrides": { "high": { "power": 25 }, "detailed": { "power": 13 } }
    }
  }
}
```

**Client resolution order** for (model, module): `[model][module]` → `[model]["*"]` → `["*"][module]` → `["*"]["*"]`; no match ⇒ the preset is hidden for that machine context. A preset whose only scopes are printing modules never resolves for a non-printing module.

**`machineModel` keys** (`PresetModel`, validate against this list — plain strings, not FKs):
- Work areas: `fbm1`, `fbb1b`, `fbb1p`, `fhexa1`, `ado1`, `fbb2`, `fbm2`, `flv1`, `fuv1`, ... (see `workarea-constants.ts`)
- HEXA RF per watt: `fhx2rf_30`, `fhx2rf_60`, `fhx2rf_80`
- Promark per laser type & watt: `fpm1_0_20`, `fpm1_0_30`, `fpm1_0_50` (Q-Switch 20/30/50 W), `fpm1_1_20`, `fpm1_1_60`, `fpm1_1_100` (MOPA 20/60/100 W)

> ⚠ The bare `fhx2rf` and `fpm1` work-area ids are type-legal (they are `WorkAreaModel`s) but
> **clients never resolve them**: preset-model resolution always maps these machines to the
> watt-qualified ids above. Scopes keyed by bare `fhx2rf`/`fpm1` are dead data — the admin
> SHOULD warn on save (accepting them is harmless but pointless).

**`layerModule` keys** (`LayerModule` ids, as string keys):

| Key | Module |
|---|---|
| `"1"` | LASER_10W_DIODE (also default CO2 for Beam series) |
| `"2"` | LASER_20W_DIODE |
| `"4"` | LASER_1064 (IR/fiber) |
| `"5"` | PRINTER |
| `"7"` | PRINTER_4C |
| `"8"` | UV_WHITE_INK |
| `"9"` | UV_VARNISH |
| `"15"` | LASER_UNIVERSAL |
| `"-1"` | UV_PRINT |

**Parameter fields** (all optional; which ones are meaningful depends on module — same keys as Beam Studio's `ConfigKeyTypeMap`):
- Common laser: `power` (0–100 %), `speed` (mm/s), `repeat` (pass count), `zStep`, `focus`, `focusStep`, `airAssist`, `minPower`, `diode`
- `dpi`: **option string**, one of `"low"`(125) `"medium"`(250) `"high"`(500) `"detailed"`(1000) `"ultra"`(2000). Not a number. All migrated legacy presets are `"medium"`.
- `dpiOverrides`: per-dpi-option deltas merged over the base values at apply time.
- Promark Q-Switch: `dottingTime` (pulse time), `fillInterval` (line width), `frequency`
- Promark MOPA / UV: `pulseWidth`, `frequency`
- Printing: `ink` (saturation), `multipass`, `halftone`, plus channel fields
- Send only keys you intend to set; the client fills required keys (`speed`, `power`, `ink`, `multipass`, `halftone`, `repeat`) from machine defaults when absent.

### 3.4 Parameter-key allowlist (optional strict validation)

Admin MAY strictly validate `settings` value keys against the client's `ConfigKeyTypeMap`
(everything in `layer-config-helper.ts`'s `attributeMap` minus the meta keys
`configName`/`module`/`color`/`clipRect`/`ref`/`materialId`/`presetId`), plus `dpiOverrides`:

```
accX accY airAssist amAngleMap amDensity backlash biDirectional ceZHighSpeed colorCurvesMap
cRatio crossHatch diode dottingTime dpi dpiOverrides fillAngle fillInterval focus focusStep
frequency fullcolor halftone height highQuality ink interpolation kRatio minPadding minPower
mRatio multipass nozzleMode nozzleOffsetX nozzleOffsetY oneWayEngraving oneWayEngravingReverse
power printingBotPadding printingSpeed printingStrength printingTopPadding pulseWidth
refreshInterval refreshThreshold repeat rightPadding scA0 scAMax scEnable scJerk speed split
travelSpeed uvCuringAfter uvCuringRepeat uvPrintingRepeat uvStrength uvXStep wInk wMultipass
wobbleDiameter wobbleStep wRepeat wSpeed yRatio zStep
```

Unknown keys are ignored by clients (never written to layers), so a typo'd key silently does
nothing — strict validation catches that at authoring time. This list grows with client
releases; sync it from `attributeMap` when adding parameters.

## 4. Localization — `LocalizedString`

```jsonc
"name": { "default": "Walnut Plywood", "zh-tw": "胡桃木夾板", "ja": "クルミ合板" }
```

- Object keyed by Beam Studio `active-lang` codes, plus mandatory `default` (English).
- Valid codes: `ca cs da de el en es fi fr id it ja kr ms nl no pl pt se th vi zh-cn zh-tw` (note: `kr` not `ko`, `zh-tw`/`zh-cn` lowercase — match these exactly).
- Client lookup: `value[activeLang] ?? value.default`. A plain string is also accepted and treated as `default`-only.
- Partial coverage is fine — never block publishing on missing translations.

## 5. Images

- `image` = absolute HTTPS URL. Convention: `<CDN>/materials/<materialId>/cover.jpg` (hero) and `<CDN>/materials/<materialId>/cover_thumb.jpg` (grid thumbnail).
- **Thumbnail ≤ 60 KB, ~480×360; hero ≤ 500 KB, ~1600×1200. Aspect ratio 4:3** for both (client crops object-fit: cover).
- The client requests `cover_thumb.jpg` in the grid by suffix substitution and falls back to `image` as-is on 404 — so publishing only a `cover.jpg` still works.
- URLs should be immutable per upload (content-hash or versioned path preferred) so browser HTTP caching works; the client does no app-level image caching in v1.
- ⚠ Infra prerequisites flagged during backend assessment: no CDN currently fronts the beam-studio S3 buckets, and flux-id has no thumbnail pipeline — both need resolving before regional launch (CloudFront distribution or reuse of `cdn.dmkt.io`, plus a Pillow resize-on-upload step).

## 6. Versioning semantics

- `version` is a single global monotonic integer for the whole catalog. Every admin publish bumps it (signal-based bump on save of any catalog model, cached in Redis, is the suggested implementation).
- Bundled snapshot = `0`; the client replaces its cache whenever a fetched `version` is greater than the cached one. No deltas in v1 — full document replace.
- Draft/unpublished rows must never leak: filter on an `isActive`/published flag in the queryset, and only bump `version` on publish.
- Client fetch triggers: app launch, on-demand (browser open after TTL), never blocking UI. Failures are silent (client shows a subtle "built-in catalog" hint).

## 7. Admin (Django) requirements checklist

- **Preset `id` immutable after creation** (read-only field once saved) — Restore contract depends on it.
- **`legacyKey` preserved verbatim** for the ~72 migrated built-ins; never renamed, never reused.
- Category restricted to the fixed choice list (§3.1); region flags restricted to `global/us/eu/tw/jp`.
- `shopLinks` editable per region in admin; never exposed in any user-facing editor (client enforces too).
- Localized `name`/`description` via the existing Translation/Text system (auto-translate available); serializer renders the `LocalizedString` object.
- Seed content: the initial catalog is the client's bundled snapshot — import `docs/material-catalog-example.json`-shaped data generated from Beam Studio (`getBundledCatalog()`), then curate photos/tags/regions in admin.

## 8. Shared fixture

`docs/material-catalog-example.json` is a small but complete example payload exercising every schema feature (localized strings, material/variant, per-region shop links, wildcard scopes, Promark/printing modules, dpiOverrides, up-to-date short-circuit shape documented inline as a sibling file if needed).

- **Beam Studio (Jest)**: asserts the fixture parses/validates against `IMaterial.d.ts` shapes and resolves through `resolvePresetSettings` / the selectors.
- **flux-id (Django)**: asserts serializer output for equivalently-seeded models deep-equals the fixture.

Change process: schema changes land in `IMaterial.d.ts` + this doc + the fixture in the same PR; the backend updates serializers to match the new fixture.
