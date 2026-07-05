/**
 * taskPath — path-based verification helpers for FLUXGhost toolpaths.
 *
 * Many release-test rows verify a feature that changes the GENERATED TOOLPATH rather than any
 * UI state (engrave DPI/resolution, auto-shrink, cut order, module offsets, speed limits …).
 * This module extracts the ad-hoc toolpath sampling used by top-bar/path-preview-ghost.spec.ts
 * and machine/swiftray-contract.spec.ts into a single reusable, unit-inspectable surface:
 *
 *   getTaskGcode()          — trigger FLUXGhost toolpath generation for the current scene and
 *                             resolve the RAW gcode text.
 *   parseGcode(text)        — parse the FLUXGhost gcode dialect into structured moves.
 *   getBBox(moves)          — bounding box of the laser-on toolpath.
 *   getRasterLines(moves)   — group horizontal engrave scan lines; count + spacing stats.
 *   rasterizeCoverage(...)  — binary grid of laser-on coverage (deterministic "visual" proxy).
 *   getCutOrderIndices(...) — ordered move indices whose point falls on a given rectangle.
 *
 * ── FLUXGhost gcode dialect (mined from tmpParseGcode.js + real output) ──────────────────────
 *   • Coordinates are ABSOLUTE and in MILLIMETRES (G90 default). Y is positive-DOWN in the raw
 *     text (the PathPreview display parser negates it; we keep raw text semantics here).
 *   • X / Y are STICKY: a line may set only one axis, the other keeps its previous value. A move
 *     is only emitted once both X and Y have been seen at least once.
 *   • Laser on/off is carried by FLUXGhost-specific markers, NOT feedrate:
 *         G1V0  → laser ON      G1S0 → laser OFF
 *     (`S`/`V` here are bare on/off flags, not a power value.) Bare `G1 X..`/`G0 X..` moves
 *     inherit the current laser state. Plain `Gn` with no V/S is treated as a rapid (off) unless
 *     laser is already on from a preceding V.
 *   • `F<num>` is feedrate in mm/min and is sticky. Raster scans alternate a fast Y-index feed
 *     (F7500) with a slower X-sweep engrave feed (e.g. F1200).
 *   • Raster engraving emits one horizontal X-sweep per scan line; successive scan lines step Y
 *     by exactly 1/dpmm mm. So scan-line COUNT scales with dpmm and spacing = 1/dpmm.
 *
 * ── Units / dpmm ─────────────────────────────────────────────────────────────────────────────
 *   All returned coordinates and distances are in millimetres. dpmm (dots-per-mm) = engrave DPI
 *   value / 25.4; the raster scan-line spacing equals 1/dpmm mm. See
 *   @core/app/constants/resolutions (getEngraveDpmm): low=5, medium=10, high=20, detailed/ultra
 *   depend on workarea.
 *
 * ── Precondition ─────────────────────────────────────────────────────────────────────────────
 *   getTaskGcode() drives the Path Preview UI, which calls exportFuncs.getGcode() → FLUXGhost.
 *   The caller MUST have landed the editor with the FileReader capture hook installed in
 *   onBeforeLoad — use installGcodeCaptureHook() inside landingEditor({ onBeforeLoad }). This is
 *   the least-invasive route: it drives the real convert engine end-to-end and needs no source
 *   changes (exportFuncs is not exposed on window). The web build never uses Swiftray
 *   (checkSwiftray → !isWeb() is false), so this always exercises the FLUXGhost/beamify engine.
 */

// ── Golden-snapshot support ──────────────────────────────────────────────────────────────────
//
// Exact normalized gcode IS the machine contract: a byte diff can stall a machine, so any change
// must surface. Tier-2 verification checks the current toolpath, byte-for-byte after
// normalization, against a checked-in reference at cypress/fixtures/golden-gcode/<name>.gc.
//
// Determinism (verified on the rig, 2026-07): the SAME scene at the SAME DPI produces
// BYTE-IDENTICAL gcode across runs — including the `;M137P...` module/prespray comments, which
// are meaningful (not timestamps). So the golden covers the FULL body, not a scoped subset.
//
// Volatile lines normalized out (see normalizeGcode): only the leading tool banner comment
// `;FLUX Laser Svgeditor Tool` and any stamped `;GHOST_VERSION ...` line we prepend. The raw
// FLUXGhost gcode carries NO embedded engine-version or timestamp, so nothing else is stripped.
// The golden is engine-version-stamped on its own first line so an engine upgrade fails loudly
// (with a "regenerate goldens" message) instead of as a confusing line diff.

const GOLDEN_DIR = 'cypress/fixtures/golden-gcode';
const VERSION_STAMP = ';GHOST_VERSION ';
const BANNER = ';FLUX Laser Svgeditor Tool';

/**
 * Normalize gcode for stable comparison: drop NULs, CRs, the volatile banner comment, and any
 * pre-existing version stamp; trim trailing whitespace; drop the trailing blank line. Everything
 * else (moves, `;M137` module comments) is meaningful and preserved verbatim.
 */
export const normalizeGcode = (text: string): string =>
  text
    .replace(NUL, '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim() !== BANNER && !line.startsWith(VERSION_STAMP))
    .join('\n')
    .replace(/\s+$/, '');

/** The engine version to stamp/verify against, from CYPRESS_ghostVersion (or 'unknown'). */
const engineVersion = (): string => String(Cypress.env('ghostVersion') || 'unknown');

/**
 * Tier-2 golden gcode snapshot check.
 *
 * Normalizes `gcodeText` and compares it EXACTLY against cypress/fixtures/golden-gcode/<name>.gc.
 *
 *   • Update mode — when Cypress.env('updateGolden') is truthy (CYPRESS_updateGolden=1), (re)write
 *     the golden (stamped with the engine version on line 1) instead of asserting, and log loudly.
 *     Mirrors Jest's `-u`.
 *   • Engine-version guard — if the golden's stamped version differs from CYPRESS_ghostVersion
 *     (only when that env is set), fail with a clear "engine version changed; regenerate goldens"
 *     message rather than a line diff. When ghostVersion is unset the guard is skipped.
 *   • On body mismatch — fail with a readable summary: the first differing lines and the total
 *     number of differing lines, plus the regenerate command.
 */
export const compareGoldenGcode = (name: string, gcodeText: string): Cypress.Chainable<void> => {
  const goldenPath = `${GOLDEN_DIR}/${name}.gc`;
  const normalized = normalizeGcode(gcodeText);

  if (Cypress.env('updateGolden')) {
    const stamped = `${VERSION_STAMP}${engineVersion()}\n${normalized}\n`;

    return cy.writeFile(goldenPath, stamped).then(() => {
      // eslint-disable-next-line no-console
      console.warn(`[golden] UPDATED ${goldenPath} (engine ${engineVersion()}, ${normalized.split('\n').length} lines)`);
      cy.log(`**GOLDEN UPDATED** ${goldenPath}`);
    });
  }

  return cy.readFile(goldenPath).then((raw: string) => {
    const goldenLines = raw.replace(/\r/g, '').split('\n');
    const stampLine = goldenLines[0]?.startsWith(VERSION_STAMP) ? goldenLines[0] : undefined;
    const goldenVersion = stampLine ? stampLine.slice(VERSION_STAMP.length).trim() : 'unknown';
    const goldenBody = normalizeGcode(raw); // strips the stamp + banner uniformly

    const ghostVersionEnv = Cypress.env('ghostVersion');

    if (ghostVersionEnv && goldenVersion !== 'unknown' && goldenVersion !== String(ghostVersionEnv)) {
      throw new Error(
        `[golden ${name}] FLUXGhost engine version changed: golden was generated against ` +
          `"${goldenVersion}" but the running engine is "${ghostVersionEnv}". Review the toolpath ` +
          `and regenerate goldens with: CYPRESS_updateGolden=1 CYPRESS_ghostVersion=${ghostVersionEnv} <run>`,
      );
    }

    const cur = normalized.split('\n');
    const gold = goldenBody.split('\n');
    const diffs: string[] = [];
    const max = Math.max(cur.length, gold.length);

    for (let i = 0; i < max; i += 1) {
      if (cur[i] !== gold[i]) {
        if (diffs.length < 8) {
          diffs.push(`  line ${i + 1}:\n    golden: ${gold[i] ?? '<missing>'}\n    actual: ${cur[i] ?? '<missing>'}`);
        }
      }
    }

    const diffCount = (() => {
      let n = 0;

      for (let i = 0; i < max; i += 1) if (cur[i] !== gold[i]) n += 1;

      return n;
    })();

    if (diffCount > 0) {
      throw new Error(
        `[golden ${name}] normalized gcode differs from the checked-in machine contract ` +
          `(${diffCount} differing line(s) of ${max}; golden ${gold.length} lines, actual ${cur.length}).\n` +
          `${diffs.join('\n')}\n` +
          `If this change is EXPECTED, regenerate + review the golden in your PR:\n` +
          `  CYPRESS_updateGolden=1 <your cypress run>\n` +
          `If UNEXPECTED, this is a machine-contract regression (different gcode can stall a machine).`,
      );
    }

    // Assert so the check registers a passing assertion in the Cypress log.
    expect(diffCount, `golden ${name} matches (0 differing lines)`).to.eq(0);
  });
};

/** A single toolpath move. Coordinates in mm (raw FLUXGhost frame: Y positive-down). */
export interface Move {
  /** feedrate in mm/min at this move (sticky; NaN before the first F). */
  feed: number;
  /** true when the laser is firing on this move (engrave/cut), false for a travel/rapid. */
  laserOn: boolean;
  x: number;
  y: number;
}

/** Axis-aligned bounding box in mm. */
export interface BBox {
  height: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  width: number;
}

/** One horizontal raster scan line (constant Y, laser-on). */
export interface RasterLine {
  /** number of laser-on points on this scan line. */
  points: number;
  /** min/max X of the laser-on span on this line (mm). */
  xMax: number;
  xMin: number;
  /** the scan line's Y coordinate (mm). */
  y: number;
}

export interface RasterLineStats {
  /** number of distinct horizontal scan lines that contain laser-on moves. */
  count: number;
  lines: RasterLine[];
  /** max/mean/min gap between consecutive scan-line Y values (mm). */
  spacingMax: number;
  spacingMean: number;
  spacingMin: number;
}

const NUL = /\0/g;

/**
 * Install a FileReader capture hook on `win`. PathPreview.updateGcode() reads the FLUXGhost
 * gcode blob via `new FileReader().readAsText(blob)`; we tee the result onto
 * `win.__taskGcode` when it looks like gcode. MUST be called from landingEditor's onBeforeLoad
 * (before app code runs) so the patched prototype is in place when PathPreview reads the blob.
 */
export const installGcodeCaptureHook = (win: Window): void => {
  const w = win as unknown as { FileReader: typeof FileReader; __taskGcode?: string };

  w.__taskGcode = undefined;

  const orig = win.FileReader.prototype.readAsText;

  win.FileReader.prototype.readAsText = function patched(this: FileReader, blob: Blob) {
    this.addEventListener('loadend', () => {
      const r = this.result;

      // Heuristic: only capture real toolpath text (has G-moves + FLUXGhost laser markers).
      if (typeof r === 'string' && r.length > 200 && /G1/.test(r) && /G1[VS]0/.test(r)) {
        w.__taskGcode = r;
      }
    });

    return orig.call(this, blob);
  };
};

/**
 * Trigger FLUXGhost toolpath generation for the current scene and resolve the raw gcode text.
 *
 * Drives the Path Preview button (the same forced-click precedent as path-preview-ghost.spec.ts:
 * the button is only visually disabled without a discovered machine, its handler still toggles
 * preview and runs exportFuncs.getGcode()). Waits out the FLUXGhost calculation via the side
 * panel, then reads the text captured by installGcodeCaptureHook.
 *
 * Precondition: installGcodeCaptureHook() must have run in landingEditor's onBeforeLoad, and the
 * scene must be non-empty. `timeout` bounds the FLUXGhost calculation (default 90s).
 */
export const getTaskGcode = (options: { timeout?: number } = {}): Cypress.Chainable<string> => {
  const { timeout = 90_000 } = options;

  cy.get('[title="Path Preview"]').click({ force: true });
  cy.get('#path-preview-side-panel', { timeout }).should('exist');
  cy.get('#path-preview-side-panel', { timeout }).should('not.contain', 'NaN');

  return cy
    .window({ timeout })
    .its('__taskGcode', { timeout })
    .should('be.a', 'string')
    .then((g) => g as unknown as string);
};

/**
 * Parse FLUXGhost gcode text into a flat list of moves. Pure and unit-inspectable.
 * Applies the sticky-axis / V-S laser-marker semantics documented at the top of this file.
 */
export const parseGcode = (text: string): Move[] => {
  const moves: Move[] = [];
  let x = Number.NaN;
  let y = Number.NaN;
  let feed = Number.NaN;
  let laserOn = false;
  let seenX = false;
  let seenY = false;

  for (const rawLine of text.replace(NUL, '').split('\n')) {
    const line = rawLine.trim();

    if (line === '' || line.startsWith(';')) continue;

    // Laser markers first — G1V0 = on, G1S0 = off (bare flags, not a power value).
    if (/G1V0/.test(line)) laserOn = true;
    else if (/G1S0/.test(line)) laserOn = false;

    const fMatch = line.match(/F(-?\d+(?:\.\d+)?)/);

    if (fMatch) feed = Number.parseFloat(fMatch[1]);

    const xMatch = line.match(/X(-?\d+(?:\.\d+)?)/);
    const yMatch = line.match(/Y(-?\d+(?:\.\d+)?)/);

    if (xMatch) {
      x = Number.parseFloat(xMatch[1]);
      seenX = true;
    }

    if (yMatch) {
      y = Number.parseFloat(yMatch[1]);
      seenY = true;
    }

    // Only emit a positional move once both axes are known and this line moved the head.
    if ((xMatch || yMatch) && seenX && seenY) {
      moves.push({ feed, laserOn, x, y });
    }
  }

  return moves;
};

/** Bounding box of the laser-on toolpath (falls back to all moves if none are laser-on). */
export const getBBox = (moves: Move[]): BBox => {
  const on = moves.filter((m) => m.laserOn);
  const pts = on.length > 0 ? on : moves;

  if (pts.length === 0) {
    return { height: 0, maxX: 0, maxY: 0, minX: 0, minY: 0, width: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const m of pts) {
    if (m.x < minX) minX = m.x;
    if (m.x > maxX) maxX = m.x;
    if (m.y < minY) minY = m.y;
    if (m.y > maxY) maxY = m.y;
  }

  return { height: maxY - minY, maxX, maxY, minX, minY, width: maxX - minX };
};

/**
 * Group laser-on moves into horizontal raster scan lines (moves sharing a Y within `yTolerance`
 * mm) and return the count plus min/mean/max spacing between consecutive scan-line Y values.
 * For a raster engrave the spacing should equal 1/dpmm and the count should scale with dpmm.
 */
export const getRasterLines = (moves: Move[], yTolerance = 1e-3): RasterLineStats => {
  const on = moves.filter((m) => m.laserOn);
  const byY = new Map<number, { points: number; xMax: number; xMin: number }>();

  for (const m of on) {
    // Quantise Y onto a tolerance grid so float noise collapses to one scan line.
    const key = Math.round(m.y / yTolerance) * yTolerance;
    const entry = byY.get(key);

    if (entry) {
      entry.points += 1;
      entry.xMin = Math.min(entry.xMin, m.x);
      entry.xMax = Math.max(entry.xMax, m.x);
    } else {
      byY.set(key, { points: 1, xMax: m.x, xMin: m.x });
    }
  }

  const lines: RasterLine[] = [...byY.entries()]
    .map(([y, v]) => ({ points: v.points, xMax: v.xMax, xMin: v.xMin, y }))
    .sort((a, b) => a.y - b.y);

  const gaps: number[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    gaps.push(lines[i].y - lines[i - 1].y);
  }

  const spacingMin = gaps.length ? Math.min(...gaps) : 0;
  const spacingMax = gaps.length ? Math.max(...gaps) : 0;
  const spacingMean = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

  return { count: lines.length, lines, spacingMax, spacingMean, spacingMin };
};

/**
 * Binary coverage grid: rasterise the laser-on toolpath into `cellMm`-sized cells. Returns a 2-D
 * boolean grid (row-major, origin at the bbox min corner) plus its geometry. A deterministic,
 * engine-version-tolerant "visual" proxy: later specs can assert coverage ratio / silhouette
 * without comparing raw gcode. Only the segment ENDPOINTS are marked (sufficient for the dense
 * point streams FLUXGhost emits); pass a coarse enough cellMm for the density you expect.
 */
export const rasterizeCoverage = (
  moves: Move[],
  cellMm: number,
): { cols: number; grid: boolean[][]; origin: { x: number; y: number }; rows: number } => {
  const bbox = getBBox(moves);
  const cols = Math.max(1, Math.ceil(bbox.width / cellMm) + 1);
  const rows = Math.max(1, Math.ceil(bbox.height / cellMm) + 1);
  const grid: boolean[][] = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));

  for (const m of moves) {
    if (!m.laserOn) continue;

    const c = Math.min(cols - 1, Math.max(0, Math.floor((m.x - bbox.minX) / cellMm)));
    const r = Math.min(rows - 1, Math.max(0, Math.floor((m.y - bbox.minY) / cellMm)));

    grid[r][c] = true;
  }

  return { cols, grid, origin: { x: bbox.minX, y: bbox.minY }, rows };
};

/** Fraction of grid cells that are covered (laser-on). Handy for coverage-ratio assertions. */
export const coverageRatio = (grid: boolean[][]): number => {
  let total = 0;
  let hit = 0;

  for (const row of grid) {
    for (const cell of row) {
      total += 1;

      if (cell) hit += 1;
    }
  }

  return total === 0 ? 0 : hit / total;
};

/**
 * Ordered indices of laser-on moves whose point lies on the perimeter of the rectangle
 * [x0..x1] × [y0..y1] (mm), within `tol` mm. Lifted from swiftray-contract's cut-order idiom:
 * compare the first/last index of one rect's moves against another's to assert cut ORDER (e.g.
 * inner shapes finish before an enclosing outer boundary). Returns indices into `moves`.
 */
export const getCutOrderIndices = (
  moves: Move[],
  rect: { x0: number; x1: number; y0: number; y1: number },
  tol = 0.6,
): number[] => {
  const within = (v: number, lo: number, hi: number) => v >= lo - tol && v <= hi + tol;
  const near = (v: number, target: number) => Math.abs(v - target) <= tol;
  const { x0, x1, y0, y1 } = rect;
  const indices: number[] = [];

  moves.forEach((m, i) => {
    if (!m.laserOn) return;

    const onPerimeter =
      within(m.x, x0, x1) &&
      within(m.y, y0, y1) &&
      (near(m.x, x0) || near(m.x, x1) || near(m.y, y0) || near(m.y, y1));

    if (onPerimeter) indices.push(i);
  });

  return indices;
};
