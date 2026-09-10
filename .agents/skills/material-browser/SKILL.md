---
name: material-browser
description: Material Browser — the catalog of materials, thickness variants and presets that replaces the legacy laser-config dropdown. Covers the bundled catalog derived from presets.ts, the mapping/curation layer, the flat user-data store, the apply pipeline (layer refs, DPI groups, configName compat), region/unit rules, and the PM CSV update workflow. Use when working on components/dialogs/MaterialBrowser/, constants/material-catalog/, stores/materialStore/, helpers/materials/, helpers/api/material-catalog/, or when applying a material parameter package from PM.
---

# Material Browser

Locations:

- UI: `packages/core/src/web/app/components/dialogs/MaterialBrowser/`
- Bundled catalog + curation: `packages/core/src/web/app/constants/material-catalog/`
- Parameter source of truth: `packages/core/src/web/app/constants/presets.ts`
- User data store: `packages/core/src/web/app/stores/materialStore/`
- Apply pipeline: `packages/core/src/web/helpers/materials/`
- Catalog cache + selectors: `packages/core/src/web/helpers/api/material-catalog/`
- Schema: `packages/core/src/web/interfaces/IMaterial.d.ts`
- Cloud contract: `docs/material-catalog-api.md` (+ `material-catalog-example.json`). The import seed for
  flux-id is NOT kept here — generate it on demand (step 4 of the CSV workflow) and hand it over.

## Overview

A full-window dialog (`showMaterialBrowser`) where the user picks a **Material** → a
thickness **Variant** → a **Preset**, and applies it to the selected layers. It replaces
`PresetDropdown` + `PresetsManagementPanel` in the layer ConfigPanel, but both modes still
exist behind one gate:

```ts
isMaterialBrowserActive() === checkMaterialBrowser() && globalPreference['use-material-browser']
```

`checkMaterialBrowser` (checkFeature.ts) is dev-only / `localStorage.enableMaterialBrowser`
until PM sets rollout dates (TODO, checkHxRf pattern). Every old-UI/new-UI branch
(`svg-editor.ts`, `MaterialChip.tsx`, `switchPresetDpiGroup`, `initMaterialApply`) goes
through this one helper — never re-derive the gate.

Entry points: `MaterialChip` in the ConfigPanel (`writeLayers: false` for the mobile modal
variant, where Apply only stages config-store values) and the legacy menu path in
`svg-editor.ts`. Every entry point calls `initMaterialBrowser()` (material-apply.ts) first:
it installs the postPresetChange override and, while the gate is on, runs the store
migration. Idempotent, never at import time.

## Data model (IMaterial.d.ts)

| Type | Notes |
|---|---|
| `Material` | `id`, `category` (fixed set: wood/acrylic/leather/metal/plastic/paper/other), `nameKey` (bundled) or `name` (cloud/user), `image`, `regions?`, `tags?`, `shopLinks?`, `variants?`, `presets`. `source` absent = catalog, `'user'` = editable. |
| `MaterialVariant` | Thickness only, **one level, never a Material**. `thicknessNum`/`thicknessDen`/`thicknessUnit` store the marketed fraction exactly (⅛″ = 1/8) — display never converts. |
| `MaterialPreset` | `settings[model][module]` → `PresetValues`. Resolution order `[model][module]` → `[model]['*']` → `['*'][module]` → `['*']['*']` (`resolvePresetSettings`). `variantId?` scopes it to one variant; absent = whole material. `groupId?` links flat per-DPI siblings. `legacyKey` = presets.ts key. |
| `MaterialCatalog` | `{ materials, publishedAt, version }`. Bundled = version 0; any cloud version ≥ 1 supersedes. |
| `MaterialUserData` | Storage key `materials`: `userMaterials` (presets/variants always empty), flat `userPresets[]` / `userVariants[]` (owner = `materialId`), `presetOverrides` (edits on catalog presets = [Customized]), `disabledPresetIds`, `migratedFromPresets`. |

Rules that shape everything else:

- **The catalog is FLAT.** `dpiOverrides` never leave the bundled builder: a presets.ts scope
  with overrides becomes the base preset (declares `dpi: 'medium'`) plus one flat preset per
  higher option (`<key>_high` …), all sharing `groupId = key`. Scopes without overrides
  declare no dpi and leave the layer DPI untouched.
- **One authoritative thickness unit per variant.** The bundled builder emits mm or the
  curated inch fraction depending on the user's default-units; material/variant ids are
  unit-independent so layer refs and favorites survive a unit switch.
- **User content is flat.** Stored user materials never embed presets/variants; a
  material's effective presets/variants = catalog list ∪ flat user lists filtered by
  `materialId`. This is also the REST contract shape.
- **`legacyKey` and `configName` are compat only.** `data-materialId` / `data-presetId`
  on the layer are authoritative (both whitelisted in sanitize.js).

## Bundled catalog (`constants/material-catalog/`)

`getBundledCatalog()` builds the offline catalog from `presets.ts` + `mapping.ts` at first
access (memoized per unit). Parameter values are **never duplicated** in mapping.ts.

- `mapping.ts` — `materialDefs` (id, nameKey, image stem, category, `regions?`, variants
  with `thicknessMm` + `thicknessInch: [num, den]`) and `presetMappings`
  (`presets.ts key → { materialId, variantId?, nameKey }`). Every presets.ts key must be
  mapped exactly once; every mapping must target an existing material/variant
  (`index.spec.ts` enforces both).
- `constants.ts` — `MATERIAL_CATEGORIES`, `CATEGORY_COLORS`, `MY_MATERIALS_ID`
  (`'user_bucket'`), `RECENTS_LIMIT`.
- Names resolve through i18n: `beambox.material_browser.catalog.materials.<nameKey>` and
  `catalog.presets.<nameKey>` (`cutting`, `engraving`, `printing`, `marking`, …). Add new
  keys to `en.ts` and `zh-tw.ts` during development; other langs before PR.
- Regions: CSV "TW+US" = omit `regions` (global — keeps EU/JP visible, deliberate);
  US-only = `['us']`; TW-only = `['tw']`. `getMaterialRegion()` maps the user's region;
  `getVisibleMaterials` hides region-gated materials, and the browser's `visibleMaterials`
  memo (index.tsx) additionally hides catalog materials with no preset for the current
  model/module — user materials are exempt. Display-only materials (no presets at all)
  therefore stay dormant in mapping/i18n/seed until presets ship.
- Images: `image: '<stem>'` → `core-img/material-catalog/<stem>.jpg`, bundled under
  `assets/img/material-catalog/` at ≤640px **square** (contract §5: 1:1 thumb + hero).
  Resize with `sips -Z 640 -s format jpeg -s formatOptions 80`; center-crop
  non-square sources first (`sips -c H W`).
- Inch fractions are **curated marketing labels**, not conversions: 2mm = 1/16″, 3mm = ⅛″,
  5mm = 3/16″, 6mm = ¼″ (the shop sells ¼″ sheets as 6mm), 7mm = 9/32″ (nearest 32nd,
  keeps it distinct from 6mm), 8mm = 5/16″, 10mm = ⅜″. Keep labels unique within a
  material — the variant Segmented and the preset editor's variant picker list every
  catalog variant regardless of machine. `inchDisplay` (`helpers/api/material-catalog/thickness.ts`) renders any reduced fraction
  typographically (precomposed glyph or super/subscript digits), so unusual denominators
  are fine to use.
- Variants are **not filtered by machine** — `getPresetsForContext` filters presets per
  model/module underneath, so a variant with no preset for the current machine just lists
  the material-wide presets. A model-aware variant filter was tried and reverted (2026-09-09):
  the preset editor's variant picker must list every variant anyway.

## User data store (`stores/materialStore/`)

Zustand store persisting three storage keys: `materials` (MaterialUserData),
`material-favorites` (material ids), `material-recents` (`{ materialId, presetId, timestamp }`,
capped at `RECENTS_LIMIT`). The legacy `presets` key is **never written** by new code
(tests enforce). `initMaterialStore()` (called via `initMaterialBrowser()`) runs the one-way idempotent migration
(`migration.ts: convertLegacyPresets`) — legacy user presets become `origin: 'user'` presets
on the "My Materials" bucket (`ensureBucket()`), legacy hidden defaults become
`disabledPresetIds` (ids = presets.ts keys).

Actions take ids, not objects: `addPreset(materialId, preset)`, `updatePreset(presetId,
scope, moduleKey, values)` (user preset → replaced in the flat list; catalog preset →
`presetOverrides` overlay, `restorePreset` deletes it), `movePreset(presetId, targetMaterialId,
targetVariantId?)` (id unchanged so layer refs stay valid; same material + same scope is a
no-op, any other move re-appends at the end), `deleteVariant` cascades scoped user presets,
`duplicateMaterial(source, name?)` deep-copies a catalog material into a user one.
`getExportData`/`importData` back `material-import-export.ts`
(`{ type: 'flux-material-library', version: 1, … }`).

## Apply pipeline (`helpers/materials/material-apply.ts`)

1. `applyMaterialPreset(material, preset, { layers, batchCmd })` — per layer: resolve
   values for the workarea's `PresetModel` + the layer module (`resolveWithOverlay` = the pure
   `resolvePresetValues` from material-catalog utils bound to the store's `presetOverrides`),
   write `dpi` if declared, call the legacy `applyPreset` with
   `toLegacyPreset(...)` (keeps forced keys / speed clamping / configName), then write
   `data-materialId` + `data-presetId`. Pushes a recent and fires the preset tutorial hook.
   `stageMaterialPreset(material, preset, values, module)` is the mobile-modal flavor: same
   payload (forced keys, speed clamp) staged in the config store only.
2. `resolveMaterialRef({ presetId, configName })` — presetId first (user presets, then
   `materialCatalogCache.findPresetById`), then configName against catalog `legacyKey`s and
   user preset names. `legacyKeyAliases` maps retired presets.ts keys
   (`canvas_fabric_printing → canvas_printing`) — **extend this table whenever a key is
   removed or merged**. Null = Manual.
3. `switchPresetDpiGroup(layer, newDpi)` — when the layer DPI changes and the applied preset
   has a `groupId`, switch refs to the sibling declaring that dpi and apply only the keys
   that differ (manual tweaks on agreed keys survive).
4. `postMaterialPresetChange` replaces the legacy postPresetChange body via
   `setPostPresetChangeOverride` (registered by `initMaterialApply()` while the gate is on).
   The legacy body would destroy the new refs if it ran in new mode.

`useAppliedMaterial` (ConfigPanel) derives the chip state from the config store: applied
material/preset/variant, mixed multi-selection, and the "modified" dot when live parameters
diverge from the preset.

## Catalog cache (`helpers/api/material-catalog/materialCatalogCache.ts`)

In-memory only (web localStorage quota). `getCatalog()` resolves immediately from
cache/bundle and fetches in the background; `getCatalogSync()` for the apply pipeline;
`refresh()` on browser open (silent failure). `CLOUD_CATALOG_ENABLED = false` until flux-id
ships `GET /api/beam-studio/material-catalog/`. Emits on `materialCatalogEventEmitter`.

Selectors (`selectors.ts`): `getVisibleMaterials`, `getMaterialsByCategory`, `searchMaterials`
(name, tags, translated category), `getSortedVariants(material, userVariants)` (mm before
inch, then by resolved thickness), `getPresetsForContext(material, model, module, userData,
variantId?)` → `ResolvedPresetRow[]` (`state: 'default' | 'customized' | 'user'`, per-DPI
catalog presets get a " - N DPI" suffix in the browser only).

## UI structure

- `index.tsx` — layout: `ControlBar` (search, Add Material, import/export), `CategoryTabs`
  (categories + favorites/recents/"result"), `CatalogGrid` of `MaterialCard`s, or
  `MaterialDetail` when `detailMaterialId` is set.
- `MaterialDetail/` — hero (cover, tags, shop link, edit/duplicate/delete), thickness
  `Segmented` in a horizontally scrolling wrapper (`.variant-scroll`), preset list of
  `PresetRow`s with Apply / edit / disable / restore / move.
- `editors/` — `MaterialEditorModal`, `PresetEditorModal` (retarget to a variant or the
  whole material), `AddPresetFromLayerModal`, `AddVariantModal`, `MovePresetModal`,
  `ThicknessInput`; `editors/index.tsx` owns the modal openers (`showAddPresetFromLayer`,
  `showMaterialEditorModal`), while `show.tsx` at the folder root owns `showMaterialBrowser`
  so nothing under `editors/` imports the dialog upward. Add-from-layer and Move both offer
  a Thickness scope ('-' = whole material) via `utils/materialTargetOptions.ts`
  (`getMaterialTargetOptions` / `getVariantTargetOptions` / `findTargetMaterial`).
- `useMaterialBrowserStore.ts` — dialog-local state (activeTab, query, detailMaterialId,
  selectedVariantId, module, writeLayers, presetEditor). `reset(init)` on every open,
  seeded from the current layer's ref (R2: open focused on the applied material).
- `utils/` — `materialTargetOptions` (above), `getCoverStyle`/`fileToCoverDataUrl` (image or
  `coverColor`/category fallback),
  `getPresetDisplayParams` (parameter pills; speed follows default-units like SpeedBlock —
  in/s with 2 decimals under inches, other lengths stay mm like their ConfigPanel blocks).

## Applying a PM parameter package (CSV)

PM ships `material_catalog_full_v<N>_with_images.csv` (21 columns: `preset_key, model,
module, material_category, name_zh/en, operation, thickness, power, speed, repeat,
dpi_high/detailed/ultra_power, region, status, source, image_filename`) plus an
`images/` folder and a sources/licence CSV. Workflow that has worked twice:

1. Dump `presets.ts` to JSON with a throwaway spec (`jest.unmock('@core/app/constants/presets')`,
   `fs.writeFileSync(JSON.stringify(presets))`), then diff every CSV row against
   `[preset_key][model][LayerModule value]` — don't trust the `status` column, rows marked
   `new` may already be in. Module names map to `LayerModule` numbers (`LASER_UNIVERSAL`
   = 15, 10W diode = 1, 20W diode = 2, 1064 = 4, PRINTER = 5, PRINTER_4C = 7).
2. `repeat = 1` in the CSV is the default — don't write it. `status = no_preset` rows are
   display-only materials (kept in mapping/i18n, hidden until presets exist).
3. New `preset_key`s: add to presets.ts, `presetMappings`, and (if a new material) a
   `materialDefs` entry + `en.ts`/`zh-tw.ts` names. New thicknesses = new variants.
4. Update the catalog snapshot with `-u`. If flux-id needs a fresh import seed, generate it
   from the real builder (throwaway spec calling `getBundledCatalog()` in mm mode, strip
   `image` — the seed never carries images) and copy it to
   `flux-id/fluxid/apps/beam_studio/tests/fixtures/material-catalog-seed.json`; it is not
   committed in this repo.
5. Check the CSV `image_filename` column for `MISSING`, and bundle any new photos.

Retiring or renaming a presets.ts key is **not** part of this: it touches
`legacyKeyAliases`, the ILang dropdown blocks, and all 23 lang files.

## Tests

- `constants/material-catalog/index.spec.ts` — mapping completeness + catalog snapshot
  (mm) + inch-mode variant checks.
- `stores/materialStore/index.spec.ts` — actions, migration, never-writes-`presets`.
- `helpers/materials/material-apply.spec.ts`, `helpers/api/material-catalog/*.spec.ts`
  (selectors, cache, utils, thickness), `useAppliedMaterial.spec.ts`,
  `MaterialCard.spec.tsx`, `MaterialDetail/PresetRow.spec.tsx`.
- Central mocks: `checkFeature` mock returns `checkMaterialBrowser() === false` so legacy
  specs run the old UI; `globalPreferenceStore` mock carries `use-material-browser`;
  `__mocks__/@core/helpers/locale-helper.ts` stubs the ESM-only bcp-47 import.

## Related

- Decision/history log: memory `material-browser-feature.md` (this skill is the
  architecture doc; keep decisions there).
- Cross-repo: flux-id owns the cloud endpoint and admin; `docs/material-catalog-api.md`
  is the contract, `material-catalog-example.json` the shared fixture.
