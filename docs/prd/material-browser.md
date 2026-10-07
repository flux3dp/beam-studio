# PRD: Material Browser

| | |
|---|---|
| **Status** | Implemented on `feat/material-browser`, PR #992 in review. Shipped in 2.7.2 with the rollout gate OFF (`materialBrowserReleased = false`); release = flip the constant once the preset package is confirmed. See §11 for open items. |
| **Author** | Product (AI PM agent) with Dean. Supersedes the 2026-06-26 product draft (not in the repo); §7 records where the build departed from it. |
| **Created** | 2026-09-30 (this document); feature work started 2026-08-07 |
| **Target product** | Beam Studio desktop + web. Multi-tab sync (scenario S11) applies to desktop only. |
| **Owner area** | Right panel / layer parameters; new `MaterialBrowser` dialog; FLUX Cloud material catalog |
| **Related code** | Dialog: `packages/core/src/web/app/components/dialogs/MaterialBrowser/`; bundled catalog: `app/constants/material-catalog/` (+ `app/constants/presets.ts`); store: `app/stores/materialStore/`; apply pipeline: `helpers/materials/` (`material-apply.ts`, `isMaterialBrowserActive.ts`, `material-import-export.ts`); catalog cache + selectors: `helpers/api/material-catalog/`; schema: `interfaces/IMaterial.d.ts`; ConfigPanel integration: `components/beambox/RightPanel/ConfigPanel/` (`MaterialChip.tsx`, `PresetDropdown.tsx`, `useAppliedMaterial.ts`); gate constants: `helpers/checkFeature.ts` |
| **External repos** | `../flux-id` owns `GET /api/beam-studio/material-catalog/` and the admin; contract in `docs/material-catalog-api.md` + `docs/material-catalog-example.json`. Import seed is generated on demand (skill, CSV step 4), not committed here. |
| **Architecture doc** | `.agents/skills/material-browser/SKILL.md` — how the code is organised. This PRD says what it must do and what must not change. |

---

## 1. Summary

Beam Studio assigns laser and printing parameters to a layer through a flat preset dropdown in the layer ConfigPanel (`PresetDropdown.tsx`, ~60 built-in entries filtered per machine model and layer module) plus a list-based `PresetsManagementPanel`. That does not scale to a growing, photographed, regional, shop-linked catalog.

The Material Browser replaces both with a full-window dialog: the user picks a **Material** (category, photo, tags) → a thickness **Variant** → a **Preset**, and applies it to the selected layers. The dropdown becomes a **material chip** (`MaterialChip.tsx`) that opens the browser focused on the layer's current material.

Three decisions shape everything else:

1. **Both modes coexist behind one gate.** `isMaterialBrowserActive()` = `checkMaterialBrowser()` (dev build, QA `localStorage['dev-material-browser']`, or `materialBrowserReleased && locale ∈ materialBrowserRegions`) AND the `use-material-browser` preference. Legacy mode is the pre-existing code, extracted but not rewritten. The gate is OFF for end users in this PR.
2. **Parameter values are never duplicated.** The bundled catalog is built at runtime from `presets.ts` (keys the legacy dropdown can label) + `material-catalog/presets.ts` (22 browser-only keys) + hand-curated `mapping.ts`. A value fix to an existing key reaches both modes.
3. **User data is flat and lives in new storage keys.** `materials`, `material-favorites`, `material-recents`. The legacy `presets` key is migrated once and never written again by new code.

Layers carry `data-materialId` / `data-presetId` as the authoritative reference; `configName` stays for compatibility with old files and legacy mode.

## 2. Background & current state

Before this branch (see `origin/main`):

- `ConfigPanel.tsx` rendered the preset `Select` inline; options came from `getPresetsList(model, module)` in `helpers/presets/preset-helper.ts`; the chosen `key || name` was written to the layer as `configName`.
- `applyPreset(layer, preset)` in `helpers/layer/layer-config-helper.ts` wrote parameter `data-*` attributes with forced keys and a speed clamp; `postPresetChange()` re-resolved every layer's `configName` after a preset edit or machine switch, clearing unknown names.
- Per-DPI variants lived inside a preset as `dpiOverrides`, replayed by `applyDpiOverrides` in `DpiBlock.tsx` / `sideEffects.ts`.
- User presets and hidden defaults were persisted under the `presets` storage key; `PresetsManagementPanel` managed them, with JSON import/export from the file menu in `svg-editor.ts`.
- No material concept, photo, category, thickness structure, region, or shop link existed.

## 3. Goals & non-goals

**Goals**

- G1. Material chip in the ConfigPanel with the same footprint as the dropdown; opens the browser focused on the applied material.
- G2. Browser with search, category tabs (Favorites / Recents / fixed categories / Others / Result), photo card grid, and a material detail view with thickness variants and preset rows (Apply / edit / disable / restore / move).
- G3. Two-level data model, Material → Variant → Preset, layered over the existing apply engine; one-way migration of legacy user presets.
- G4. Offline bundled catalog now; FLUX Cloud catalog later through the same schema (contract in `docs/material-catalog-api.md`).
- G5. Users create, edit, duplicate, disable, and delete their own content, including "Add preset from current layer" and "Add thickness".
- G6. Region-aware content (`getMaterialRegion()` → us / eu / tw / jp / global, with a Preferences override) gating catalog visibility and shop links.
- G7. Rename the empty-selection label from "Custom" to "Manual".

**Non-goals**

- Re-engineering the parameter math, forced keys, or clamping (reused through `applyPreset`).
- In-app purchase; shop links open the browser via `browser.open`.
- Cloud sync of user content across devices (Phase 2). User content is local plus manual import/export.
- Building the flux-id admin (separate repo); this PRD defines only what the client consumes.
- Cloud fetch is scaffolded but disabled (`CLOUD_CATALOG_ENABLED = false`) until flux-id ships the endpoint.

## 4. Scenarios

| # | Scenario | Entry point |
|---|---|---|
| S1 | Apply a catalog preset to the selected layers | ConfigPanel chip → browser → material → variant → Apply |
| S2 | Save the current layer's live parameters as a preset | Material detail → Add preset → From current layer |
| S3 | Edit a catalog default, see it tagged [Customized], restore it | Preset row `⋯` → Edit / Restore |
| S4 | Change layer DPI on a preset with per-DPI siblings | ConfigPanel DPI block |
| S5 | First run with existing legacy user presets | Any entry point while the gate is on |
| S6 | Switch default units mm ↔ inch | Preferences |
| S7 | Export the library, import it on another machine or back into itself | Browser control bar icons; legacy file menu |
| S8 | Gate off: everything behaves as on `main` | Default for end users |
| S9 | Add a thickness that the catalog has but the current machine hides | Material detail → Add thickness |
| S10 | Mobile layout: apply from the modal variant without writing layers | ConfigPanel mobile modal (`writeLayers: false`) |
| S11 | Two desktop tabs edit the library | Electron multi-tab |

### 4.1 Acceptance criteria

**S1 Apply.** Select one or more layers, click the chip, pick a material card, a thickness in the Segmented, and press Apply on a row. Result: each selected layer gets the preset's values for its own module (resolution `[model][module]` → `[model]['*']` → `['*'][module]` → `['*']['*']`), `dpi` if the preset declares one, forced keys and speed clamp applied, `data-materialId` + `data-presetId` written, `configName` set for compatibility, the material pushed to Recents, the chip showing the material and variant names. Edge: a catalog material with no preset resolvable for the current model/module is not listed at all (user materials always are). Edge: rows disabled by the user are dimmed and not appliable. Edge: save and reopen the `.beam` file, both `data-*` attributes survive `sanitizeSvg`.

**S2 Add from layer.** With a layer selected, open a material, choose Add preset → From current layer. The modal shows the captured values, a material target (existing user material, existing catalog material, or "create new" which lands in the "My Materials" bucket), and a Thickness scope ('-' = whole material, defaulting to the active variant). Result: a user preset with all of the layer's config keys for its module (laser: speed, power, minPower, repeat, height, zStep, focus, focusStep; printing and Promark: their own key sets), scoped `['*'][module]`; the layer's chip now references it with no "modified" dot. Edge: with multiple layers of differing values selected, keys with mixed values are omitted.

**S3 Customize / restore.** Edit a catalog preset's name or numbers. Result: the row shows [Customized], values come from `presetOverrides[presetId]`, the catalog file is untouched, Restore removes the overlay. Editing a user preset merges the form fields onto the stored cell; keys the form does not show (S2's minPower, focus, …) are preserved. Defaults cannot be deleted, only disabled.

**S4 DPI switch.** Apply an engraving preset that has per-DPI siblings (`groupId` shared), then change the DPI block. Result: the refs move to the sibling declaring the new DPI and only the keys whose values differ between the two siblings are rewritten, so manual tweaks on other keys survive. Edge: no sibling for that DPI → no-op, no dot. Edge: switching to a machine on which the applied preset does not resolve → `postMaterialPresetChange` falls back across the group (prefer the layer's DPI, else first resolvable, else Manual).

**S5 Migration.** Legacy `presets` storage contains user presets and hidden defaults. Turn the gate on and open the browser. Result: user presets appear under "My Materials" as [User Defined] with `origin: 'user'`; hidden defaults are in `disabledPresetIds` (ids = presets.ts keys); `migratedFromPresets` is true; running again adds nothing; the `presets` key is byte-identical afterwards.

**S6 Units.** Switch default units. Result: thickness labels re-render in the other unit (inch as curated fractions with typographic display, e.g. 3mm = ⅛″, 7mm = 9/32″); favorites, recents, pins, and layer refs still resolve because ids are unit-independent; speed pills follow the unit like SpeedBlock.

**S7 Import / export.** Export writes `{ type: 'flux-material-library', version: 1, ...MaterialUserData }`. Import merges: colliding material ids get new ids and their variants follow; colliding variant ids get new ids and presets referencing them follow; colliding user preset ids get new ids and `disabledPresetIds` follows; bucket presets whose display name already exists in the bucket are skipped; overrides, pins, and disabled ids are unioned. Edge: a legacy `presets` JSON export imports through the same file menu when the gate is on (routed to `importMaterialLibrary`) and lands as user presets; the `presets` key is not written. Edge: importing your own export back gives duplicates with fresh ids and identical disabled state.

**S8 Gate off.** With `materialBrowserReleased = false`, not a dev build, and no QA flag: ConfigPanel renders `PresetDropdown` (verbatim extraction), the presets management button opens `PresetsManagementPanel`, the file menu imports presets the old way, `postPresetChange` runs its legacy body, DPI overrides replay via `applyDpiOverrides`. The Preferences toggle for the browser is not rendered. Cypress `laser-panel.spec.ts` preset counts hold.

**S9 Add thickness / pin.** On a catalog material where machine A hides a variant (no preset resolves for the current model/module), Add thickness with that value. Result: the catalog variant is pinned (`pinnedVariantIds`) rather than rejected as "exists"; it lists with a delete icon while the pin is the sole reason it is visible; deleting drops the pin and cascades user presets scoped to it. On machine B where a built-in preset targets that variant the delete icon is absent.

**S10 Mobile modal.** `writeLayers: false`. Apply stages values in the config panel store only (forced keys and speed clamp still applied); no layer attribute is written until the modal commits.

**S11 Multi-tab.** Tab A adds a material. Result: tab B's browser lists it without reload. Tab B then adds a material; tab A's material is still present in storage. Known limit: two writes in the same instant are last-writer-wins at the blob level (§12).

## 5. Must not change

Regression contract for everything this branch touched outside `MaterialBrowser/`, `material-catalog/`, `materialStore/`, `helpers/materials/`, `helpers/api/material-catalog/`, i18n, and assets. Reviewers check this list against `git diff --stat origin/main...HEAD`.

**`helpers/layer/layer-config-helper.ts`** — `materialId` / `presetId` added to the string-typed attribute list; clamp body extracted to `clampLayerConfigLimits`; `postPresetChange` gained an override seam.
- `ConfigPanel/PresetDropdown.tsx` → `applyPreset` — legacy dropdown apply: forced keys, speed clamp, `configName` written exactly as before.
- `ConfigPanel/sideEffects.ts` → `applyPreset` — module-change re-apply unchanged.
- `helpers/layer-module/change-module.ts` → `applyPreset` — layer module switch re-applies the matching preset unchanged.
- `ConfigPanel/ConfigPanel.tsx`, `dialogs/PresetsManagementPanel/PresetsManagementPanel.tsx` → `postPresetChange` — with no override registered the legacy body runs verbatim (same clamp order, same `configName` clearing).
- `helpers/materials/material-apply.ts` → `setPostPresetChangeOverride` — registered only while the gate is on and unregistered when the preference flips off; the legacy body must never run against new-mode refs and vice versa.
- `getData` / `writeDataLayer` on the two new keys — read as strings, no numeric coercion, cleared on Manual.

**`app/actions/beambox/svg-editor.ts`** — file-menu import branches on the gate.
- Gate off → `importPresets(file)` from `preset-helper.ts` as on `main`.
- Gate on → `initMaterialBrowser()` then `importMaterialLibrary(file)`; the `presets` key is never written.

**`ConfigPanel/ConfigPanel.tsx`** — dropdown logic moved to `PresetDropdown.tsx`.
- Gate off renders `PresetDropdown`; the extraction is a pure move (diff it against `main`'s inline block).
- `ConfigPanel/ParameterTitle.tsx` — gate off shows the presets-management button; gate on shows the browser opener.

**`ConfigPanel/DpiBlock.tsx`, `ConfigPanel/sideEffects.ts`** — `switchPresetDpiGroup` inserted before `applyDpiOverrides`.
- Layer without a material ref → `switchPresetDpiGroup` returns false and `applyDpiOverrides` replays legacy `dpiOverrides` unchanged.
- Layer with a material ref → `applyDpiOverrides` early-returns (flat catalog has no overrides to replay).

**`components/tutorials/tutorialController.ts`, `TutorialContext.tsx`, `helpers/eventEmitterFactory.ts`** — both tutorial files now obtain the emitter by name (`'tutorial'`) instead of one importing the other.
- Every tutorial step that listens on the context emitter still receives events from the controller (same memoized instance).
- `helpers/presets/preset-tutorial.ts` — the preset-applied tutorial hook fires from both apply paths.

**`app/constants/presets.ts`** — value and scope edits only.
- `preset-helper.ts` → `getPresetsList` — every key is still labelled by the ILang dropdown blocks; never delete or rename a key (`canvas_fabric_printing` was restored for this reason). Browser-only keys go in `material-catalog/presets.ts`, and `material-catalog/index.spec.ts` asserts the two key sets are disjoint.
- `apps/web/cypress/e2e/right-panel/laser-panel.spec.ts` — the legacy dropdown preset count per model.

**`app/constants/storageConstants.ts`, `interfaces/IStorage.d.ts`** — three keys added.
- `storageStore.ts` — the `presets` key keeps its type and is written only by legacy code (`materialStore/index.spec.ts` enforces "never writes presets").

**`public/js/lib/svgeditor/sanitize.js`** — `data-materialId`, `data-presetId` whitelisted on `g`.
- `sanitizeSvg` on file load keeps them; no other tag gains attributes.

**`app/actions/beambox/beambox-preference.ts`, `stores/globalPreferenceStore.ts`, `interfaces/Preference.d.ts`** — `use-material-browser` (default true), `material-region-override` (default auto).
- `components/settings/categories/Editor/Workarea.tsx` — the toggle renders only when `checkMaterialBrowser()` is true; the region picker only when `materialBrowserRegions.length > 1`. Other Workarea settings untouched.

**`helpers/checkFeature.ts`** — `materialBrowserReleased`, `materialBrowserRegions`, `checkMaterialBrowser`.
- Every old/new branch point (`svg-editor.ts`, `ConfigPanel.tsx`, `ParameterTitle.tsx`, `material-apply.ts`) goes through `isMaterialBrowserActive()`; nothing re-derives the gate.

**Central mocks** — `__mocks__/@core/helpers/checkFeature.ts` returns `checkMaterialBrowser() === false` so every pre-existing spec runs the legacy UI; `__mocks__/@core/app/stores/globalPreferenceStore.ts` carries the new preference; `__mocks__/@core/helpers/locale-helper.ts` is new (stubs the ESM-only bcp-47 import).

## 6. Design

The skill doc has the full architecture. The points a reviewer needs:

- **Gate** (`isMaterialBrowserActive.ts`): one function, one reactive hook. `initMaterialBrowser()` is the single entry-point init: registers the `postPresetChange` override (self-syncing with the preference) and runs the store migration only while the gate is on. Never at import time.
- **Bundled catalog** (`material-catalog/index.ts`): built lazily from the two preset tables + `mapping.ts`, memoized per unit. Catalog is flat: a presets.ts scope with `dpiOverrides` becomes a base preset plus one flat preset per DPI option, all sharing `groupId`. Variants carry one authoritative thickness unit (mm or curated inch fraction). Region on a material def gates visibility.
- **Store** (`materialStore/index.ts`): Zustand over three storage keys. Actions take ids. User content is flat (`userMaterials` never embed presets or variants; `userPresets[]` / `userVariants[]` own a `materialId`). Catalog edits are `presetOverrides[presetId]`. Resyncs from storage when another tab writes any of the three keys.
- **Apply** (`material-apply.ts`): resolve values for the workarea's `PresetModel` + layer module with overlay, write `dpi` if declared, delegate to legacy `applyPreset` via `toLegacyPreset`, then write the two refs. `resolveMaterialRef` = presetId first, then `configName` against catalog `legacyKey`s and user preset names; null = Manual.
- **UI**: `index.tsx` layout → `ControlBar` / `CategoryTabs` / `CatalogGrid` of `MaterialCard`, or `MaterialDetail` (hero, scrolling thickness Segmented, `PresetRow`s). Editors under `editors/`; `show.tsx` owns the opener so nothing under `editors/` imports upward. Dialog-local state in `useMaterialBrowserStore`, reset on every open from the layer's ref.

## 7. Deviations from the original draft

The 2026-06-26 draft was written before the code. Its goals G1–G7, requirements R1–R24, and decisions D1–D19 stand except where listed here. Each row names the draft item and what shipped instead.

| Draft | Built | Why |
|---|---|---|
| draft §6.1 `parentId`; R10 variants are child materials | `Material.variants[]` + `MaterialPreset.variantId?`; a variant is never a material | Removed O(n²) parent scans and `allMaterials` threading (2026-08-13) |
| draft §6.1 `thicknessMm` / `thicknessInch` on the material; "store the exact decimal, round for display" | Thickness lives only on variants as `thicknessNum` / `thicknessDen` / `thicknessUnit`; fractions stored exactly, display never rounds | Inch fractions are curated marketing labels (¼″ sheets sell as 6mm), not conversions (2026-08-12) |
| draft §7.3, R20, D6: region drives units; the Preferences override switches units | Units follow the `default-units` preference; region only gates visibility and shop links. `material-region-override` exists but does not touch units | Per-material units matched the shop reality better than per-region (2026-08-12, deliberate) |
| draft §6.1 `source` enum `flux_global` / `flux_shop` / `region_pack` / `user` | `source?: 'default' \| 'user'`, absent on catalog content; dropped from the cloud payload | Client only needs catalog-vs-user; D17 already hid origin from users |
| draft §6.2 `customized` flag on the preset; draft §6.6 Restore matches by id | Edits to catalog presets are `presetOverrides[presetId]` in user data; the catalog object is untouched; Restore deletes the overlay | Same behaviour, no mutation of cached catalog data |
| draft §6.2 `dpiOverrides` reused; D19 HEXA RF Fast/Quality pair | `dpiOverrides` removed from the schema; each DPI option is a flat preset (`<key>`, `<key>_high`, …) linked by `groupId`; the DPI block switches within the group | The two-layer override structure caused fold/merge bugs in four attempts (2026-08-13). The "DPI change auto-compensates" requirement was dropped |
| draft §6.1 fixed categories incl. glass / stone / rubber | glass, stone, rubber removed from `MaterialCategory`; those materials sit under Others | Meeting 2026-08-17 |
| R8a / D4: materials always shown, empty categories with guidance | Catalog materials with no preset resolvable for the current model/module are hidden; empty category tabs still render, dimmed and sorted after Others | Meeting 2026-08-17 replaced dim-and-sort-last with hiding |
| draft §5.2 machine-independent thickness switcher | Variants are filtered by machine (`getVisibleVariants`); Add thickness pins a hidden catalog variant | 2026-09-11, viable once the pin escape hatch existed |
| R7 iconed category tabs | Category colors, no icons | Icons not drawn; open follow-up (§12) |
| R5 add-from-layer affordance in the layer panel | Built: `ParameterTitle.tsx` button (no material preselected → picker, bucket fallback) and the material detail header (preselects material + active variant) | As drafted, plus the in-detail entry |
| draft §7.1–7.2 cloud catalog refresh on launch | Scaffolded in `materialCatalogCache.ts`, `CLOUD_CATALOG_ENABLED = false`; no "showing built-in catalog" indicator | flux-id endpoint not shipped |
| draft §9 mapping "generated once and maintained in Cloud" | `mapping.ts` + the two preset tables are maintained in this repo through the PM CSV workflow until the cloud ships | Cloud not live |
| draft §5.5 / D1 rename "Custom" → "Manual" | Chip shows "Manual" / "Manual settings" from `beambox.material_browser.manual`; the legacy `custom_preset` string is unchanged for legacy mode | Both modes coexist |
| draft §12 rollout "phased enable by region" | `materialBrowserReleased` constant + `materialBrowserRegions` list; region picker in Preferences appears only with more than one released region | As drafted |
| draft §11 success metrics | Not instrumented | No analytics hook in this PR |

## 8. Data contracts

- **Schema**: `interfaces/IMaterial.d.ts`. `Material { id, category, nameKey | name, image?, regions?, tags?, shopLinks?, variants?, presets, source? }`; `MaterialVariant { id, thicknessNum, thicknessDen, thicknessUnit, image? }`; `MaterialPreset { id, groupId?, legacyKey?, variantId?, settings[scope][module] → PresetValues }`; `MaterialUserData { userMaterials, userPresets, userVariants, presetOverrides, disabledPresetIds, pinnedVariantIds, migratedFromPresets }`.
- **Storage**: `materials` (MaterialUserData), `material-favorites` (material ids), `material-recents` (`{ materialId, presetId, timestamp }`, capped at `RECENTS_LIMIT`).
- **Layer attributes**: `data-materialId`, `data-presetId` (authoritative), `configName` (compat).
- **Export file**: `MaterialLibraryExport = MaterialUserData & { type: 'flux-material-library', version: 1 }`. Import also accepts the legacy `presets` export shape.
- **Cloud**: `docs/material-catalog-api.md` (camelCase, flat per-DPI presets sharing a name, no `dpiOverrides`, 1:1 covers ≤640px bundled). Bundled catalog is version 0; any cloud version ≥ 1 supersedes.
- **PM parameter package**: `material_catalog_full_v<N>_with_images.csv`; workflow in the skill. `repeat = 1` is the default and not written; `status = no_preset` rows are display-only materials that stay hidden until presets exist.

## 9. Performance & packaging

- Catalog build is lazy and memoized per unit; first browser open pays it once.
- Cover photos: 38+ JPEGs ≤640px square under `assets/img/material-catalog/`; user covers are stored as data URLs inside `materials`, so a storage quota overrun is surfaced as an alert rather than dropped silently.
- Catalog cache is in-memory only (web localStorage quota); the bundle is the offline fallback.

## 10. Rollout

1. **PR #992** (this branch): full feature, gate OFF. Ships in 2.7.2 so QA can enable it with the `dev-material-browser` flag on release builds.
2. **Release**: flip `materialBrowserReleased = true` in `checkFeature.ts` once PM confirms the 2.7.2 preset package; `materialBrowserRegions` starts at `['tw']` (TW + HK). Adding a second region makes the Preferences region picker appear on its own.
3. **Cloud**: flux-id ships the endpoint, then flip `CLOUD_CATALOG_ENABLED`.
4. **Phase 2** (not scheduled): cloud sync of user content, favorites in cloud, richer shop integration.

## 11. Open decisions

Struck-through items are settled; the date and outcome are recorded in place.

1. **Release flip.** When does `materialBrowserReleased` go true, and with which regions? Blocked on PM confirming the 2.7.2 preset values.
2. **TW shop links.** Nine links in `mapping.ts` under `// TODO: confirm the TW shop links`. Open calls: teak/poplar plywood (unmapped or onto `wood`), leather kits (no link), mixed acrylic (search page vs one product).
3. **HEXA RF Quality preset values** are placeholders derived from the old `dpiOverrides.high`; content team to curate through the cloud catalog.
4. **7mm variant vs PM sheet.** Code keeps 7mm as its own variant at 9/32″ (Dean, 2026-09-09); the PM sheet still lists 7mm rows and the retired-then-restored `canvas_fabric_printing` as existing. Needs a PM sheet update.
5. **Editor field clearing.** The preset editor cannot clear a field: empty inputs are filtered before save, and since 2026-09-30 the store merges onto the existing cell, so "clear" means "keep old value". No current form field is optional except printing DPI. If one becomes optional, send `null` and delete on `null` in the store.
6. ~~**Flat user presets.**~~ Decided 2026-08-12: one flat `userPresets[]` with `materialId`; stored user materials never embed presets.
7. ~~**Thickness unit.**~~ Decided 2026-08-12: `thicknessNum/Den/Unit` per variant, stored exactly, never converted on display; region gates visibility only.
8. ~~**Variants are not materials.**~~ Decided 2026-08-13: `Material.variants[]` + `MaterialPreset.variantId?`; thickness lives only on variants; flat `userVariants[]` mirrors presets.
9. ~~**DPI model.**~~ Decided 2026-08-13 after four attempts: flat per-DPI presets linked by `groupId`; `dpiOverrides` never leave the bundled builder; "DPI change auto-compensates" requirement dropped.
10. ~~**Unsupported materials.**~~ Decided 2026-08-17: hidden for the current model/module (was dim-and-sort-last); categories glass/stone/rubber folded into Others; Duplicate prompts for a name.
11. ~~**Machine-aware variants.**~~ Decided 2026-09-11 (reverses 2026-09-09): variants filtered by machine, with `pinVariant` as the escape hatch through Add thickness.
12. ~~**Legacy vs browser preset keys.**~~ Decided 2026-09-11: `presets.ts` holds only keys the legacy dropdown can label; browser-only keys in `material-catalog/presets.ts`; never delete or rename a legacy key.
13. ~~**Ship gated.**~~ Decided 2026-09-11: code ships in 2.7.2 with the locale gate off; no commented-out code, the constant is the switch.

## 12. Risks & follow-ups

- **Multi-tab is last-writer-wins at the blob level.** Resync on storage change (2026-09-30) removes the stale-overwrite bug; simultaneous writes still race. Upgrade path: per-key merge in `persistUserData`.
- **Storage quota** from data-URL covers on user materials; surfaced as an alert, not prevented.
- **flux-id fixture drift.** Their `material-catalog-example.json` copy is stale (source-field removal, sparkle-acrylic rename, `groupId`) and their serializer still emits `source`. Tracked in flux-id, unclaimed.
- **i18n drift.** `catalog.materials` is `Record<string, string>`, so TS does not catch a missing key in one of the 21 translated files; verify with a key-set diff against `en.ts`.
- **Category icons** not drawn; the UI uses category colors.
- **Mobile drawer** active-key reset in ObjectPanelController untested on hardware.
- **No cloud yet**, so catalog updates still require an app release via the PM CSV workflow.

## 13. Test plan

Maps onto §4.1. Unit specs (21 on the branch) cover the logic; the manual rows need a machine or the dev flag.

| Criterion | Automated | Manual |
|---|---|---|
| S1 apply, refs, sanitize | `material-apply.spec.ts`, `useAppliedMaterial.spec.ts`, `PresetRow.spec.tsx` | Save/reopen `.beam`, check `data-materialId` survives |
| S2 add from layer | `presetDisplayParams.spec.ts` | Capture a layer with focus/minPower set, verify chip shows no dot |
| S3 customize / restore / merge | `materialStore/index.spec.ts` ("updatePreset …" cases) | Rename a captured preset, re-apply, check hidden keys still apply |
| S4 DPI group switch | `material-apply.spec.ts` (`switchPresetDpiGroup`) | Change DPI on wood engraving, tweak power first, confirm tweak survives |
| S5 migration | `materialStore/index.spec.ts` (migration, never-writes-presets) | Seed legacy presets, enable flag, open browser twice |
| S6 units | `material-catalog/index.spec.ts` (mm + inch builds), `thickness.spec.ts` | Toggle units with favorites and an applied layer |
| S7 import / export | `materialStore/index.spec.ts` (importData remap cases) | Export, import back, confirm disabled copy stays disabled |
| S8 gate off | Every pre-existing spec via the `checkFeature` mock; Cypress `laser-panel.spec.ts` | Release build without flag: dropdown, management panel, file import |
| S9 pin | `selectors.spec.ts` (`getVisibleVariants`) | Pin on one model, switch model, check delete icon rule |
| S10 mobile staging | `material-apply.spec.ts` (`stageMaterialPreset`) | Mobile layout apply then cancel |
| S11 multi-tab | `materialStore/index.spec.ts` ("storage update from another tab") | Two Electron tabs, add in each, reload both |
