# SVG import export guides

| Field | Value |
| --- | --- |
| Status | Implemented; targeted tests and repository lint passed; real-export/manual UI trial pending |
| Author | Codex |
| Created | 2026-11-26 |
| Target product | Beam Studio desktop and web |
| Owner area | SVG import |
| Related code | `packages/core/src/web/app/svgedit/operations/import/importSvg/`, `packages/core/src/web/app/components/dialogs/RadioSelectDialog.tsx`, `packages/core/src/web/app/actions/dialog-caller.tsx` |

## Summary

Show a matching export tutorial below the layering choices when an imported SVG contains recognizable Illustrator, Inkscape, or Affinity markers.

## Background & current state

`importSvg/index.tsx::performSvgPreChecks` already reads the original Blob and parses an XML document. `importSvg/index.tsx::importSvg` calls `determineImportType` before `uploadAndDivideSvg`; source detection therefore needs no FLUXGhost changes. `utils/determineImportType.tsx` uses the shared `RadioSelectDialog`; this change adds optional supplementary content below its choices.

## Goals & non-goals

Provide a relevant tutorial without changing import results. Source recognition is a heuristic, not proof of the last exporter. No backend protocol, SVG rewriting, saved document attributes, or additional dialogs.

## Scenarios

Import recognizable SVGs, unknown/optimized SVGs, and SVGs carrying conflicting software markers. Open a tutorial while choosing layering. Preserve callers that already bypass the layering dialog.

## Acceptance criteria

1. Import an SVG with a document-level or root-child `Generator: Adobe Illustrator ...` comment, or a root namespace declaration whose resolved value is `http://ns.adobe.com/AdobeIllustrator/10.0/`. The namespace may be written literally or through an internal XML entity such as `ns_ai`; the prefix and entity name do not matter. Below the layering choices, show `了解更多關於 Adobe Illustrator 的匯出方式`, linking to `https://support.flux3dp.com/hc/zh-tw/articles/4405279401487` in Traditional Chinese and its `en-us` equivalent in other languages. A misleading prefix, unused entity definition, or namespace found only in embedded content does not qualify.
2. Import an SVG with a root Inkscape namespace `version` attribute or a document-level/root-child `Created with Inkscape ...` comment. Show the equivalent Inkscape text and article `4405279437839`, using the same locale rule.
3. Import an SVG with an attribute in `http://www.serif.com/`. Show the equivalent Affinity Designer text and article `360001558716`, using the same locale rule. A namespace declaration alone does not qualify. This trial treats Serif attributes as an Affinity-family heuristic and cannot distinguish Designer from other Serif products.
4. Import plain SVGs, SVGs with software names only in text/layer names, or conflicting recognized markers. No tutorial appears; import still works. Nested embedded SVG metadata must not determine the outer document's source.
5. Select a different layering option, then activate the tutorial by mouse or keyboard. Open the article through the platform browser implementation; the dialog remains open and preserves its selection. Confirm and cancel retain their existing behavior.
6. Imports with an explicit import type or only one available option still skip the dialog. AI conversion (`skipByLayer`) does not gain this SVG-only tutorial.

## Must not change

- `app/components/dialogs/RadioSelectDialog.tsx` — `app/actions/dialog-caller.tsx::showRadioSelectDialog` preserves options, default selection, confirm/cancel, and layout when no supplementary content is supplied.
- `app/actions/dialog-caller.tsx::showRadioSelectDialog` — `importSvg/utils/determineTargetModule.ts` keeps module selection unchanged.
- `app/actions/dialog-caller.tsx::showRadioSelectDialog` — `components/dialogs/PresetsManagementPanel/PresetsManagementPanel.tsx` keeps preset-module selection unchanged.
- `app/actions/dialog-caller.tsx::showRadioSelectDialog` — `importSvg/utils/determineImportType.tsx` keeps preference IDs, available choices, and remembered defaults unchanged.
- `importSvg/index.tsx::performSvgPreChecks` — `importStl/importSvgFile.ts` preserves size/complexity warnings and proceed/cancel decisions; the new optional source field is ignored.
- `importSvg/index.tsx::importSvg` — `app/actions/beambox/svg-editor.ts` keeps ordinary SVG import results, PDF/AI conversion, cancellation, and inner-engraving routing unchanged.
- `importSvg/index.tsx::importSvg` — `helpers/api/ai-extension.ts` keeps its explicit `layer` import type and does not open a layering dialog.
- `app/lang/*.ts`, `interfaces/ILang.ts` — existing translation consumers retain all keys and values; only a new interpolated tutorial label and localized tutorial URLs are added.

Paths above are relative to `packages/core/src/web/` unless inside the SVG import folder.

## Design

Add a pure document detector inside `importSvg/utils/`. Reuse the precheck's parsed document and return an optional source alongside its existing result. Match comment formats, the resolved Illustrator namespace declaration on the root SVG, the Inkscape namespace URI plus `version`, and actual Serif attributes. Inspect only document/root comments and the outer SVG's elements, excluding nested SVG subtrees. Collect matches and return a source only if exactly one software matches. Thread the source through `determineImportType` into optional shared-dialog supplementary content, with spacing defined in `RadioSelectDialog.module.scss`. Keep the three full article URLs in each language file (`export_guide_urls`), using `zh-tw` for Traditional Chinese and `en-us` for other languages, consistent with existing help links. Use an i18n string with `%s` for software names.

## Data contracts

Local-only source union: `illustrator | inkscape | affinity`. Unknown or conflicting input returns `undefined`. No transport or persistence changes.

## Performance/packaging

Reuse the existing DOM parse; add one linear traversal without another Blob read or network call. No new dependencies.

## Rollout (PR plan)

One Beam Studio change with detection tests, dialog interaction coverage, translations, and this PRD. Trial real exporter files before calling the heuristic comprehensive.

## Open decisions

1. ~~Use Serif attributes as an Affinity-family proxy for the Designer guide?~~ Trial accepted on 2026-11-26 following the user's request to try the proposed detection. Files with only a Serif namespace declaration remain unknown.
2. Broaden detection only after checking real exports from additional versions/presets; no guesses based on SVG formatting.
3. ~~Accept the Illustrator namespace as a supplementary marker?~~ Accepted on 2026-11-26. Match the root declaration's resolved URI, not `i` or `ns_ai`. Export examples appear in [Adobe's issue tracker](https://illustrator.uservoice.com/forums/601447-illustrator-desktop-bugs/suggestions/31110367-exporting-svg-1-2-tiny-gives-a-metadata-namespac) and [Adobe Community](https://community.adobe.com/questions-652/svg-file-saving-issue-817209). XML parsing already expands internal entities; detection adds no entity substitution or external fetching.

## Risks & follow-ups

Optimizers can remove markers; other editors can preserve them. Illustrator detection requires its generator comment or a matching root namespace declaration: compact one-line SVGs still qualify if they retain either marker, but exports without both remain unknown. This does not cover every Illustrator SVG or assume that every Minify export removes comments. Serif attributes are not proven exclusive to Designer. Unknown and conflicting files deliberately omit help. Article URLs follow the selected language file: Traditional Chinese uses `zh-tw`; other languages use `en-us`. Narrow dialogs may wrap the single link naturally.

## Test plan

Unit fixtures cover each accepted marker, changed namespace prefixes/entity names, Illustrator internal entities and literal declarations, unused or misleading entity definitions, insufficient Inkscape/Serif declarations, conflicting sources, nested content, ordinary text, malformed XML, and unknown SVG. Dialog tests cover all article destinations, link activation without selection loss, no-help callers, and confirm/cancel. Import-type tests cover explicit choices, single-option bypass, printing choices, and remembered defaults. Run focused Jest in band and repository lint; record remaining manual checks in Status.

Validation on 2026-11-26: the namespace detector and import-dialog suites passed 51 tests, including literal/entity namespace forms, alternative prefixes and entity names, conflicts, and localized links; scoped lint passed for both detector files. The existing inner-engraving SVG import suite passed during initial validation. The localized-URL and SCSS-module follow-up passed two dialog suites (11 tests), including all three Traditional Chinese article destinations and click handlers. Full repository lint passed for the SCSS-module change (existing warnings remain); locale follow-up lint is scoped to the affected language, interface, and dialog files. Core TypeScript checking reported errors in untouched files (including existing store mock omissions and SVG element typings); no diagnostics referenced this change's files. Real desktop/web layout, keyboard activation, and exports from the three actual applications remain manual trial items.
