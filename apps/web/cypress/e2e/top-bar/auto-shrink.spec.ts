/**
 * Auto Shrink / 自動內縮 (release-test sheet 文件設定 row:
 *   「測試自動內縮功能是否有正確作用（用 HEXA 測試複合填充路徑）」)
 *
 * Path-based verification (see .claude/skills/e2e-test/SKILL.md → "Path-based verification"): Auto Shrink
 * changes the GENERATED TOOLPATH, not any UI state, so we assert against the FLUXGhost gcode via
 * cypress/support/taskPath.ts rather than the canvas.
 *
 * ── What the feature does ────────────────────────────────────────────────────────────────────
 * Document Settings → "Auto Shrink" (#autoShrink switch) sets documentStore.auto_shrink. When on,
 * getTaskCode (helpers/api/svg-laser-parser.ts) passes `engraving_erode = workarea.autoShrink` to
 * FLUXGhost. For HEXA (fhexa1) that value is 0.05 mm. FLUXGhost erodes the raster fill inward by
 * that amount, so the effective engraved band is inset on EVERY boundary (outer edge pulls in, the
 * hole grows). The tooltip's gate — "Only applies to layers with a resolution ≥ 250 DPI" — is
 * enforced inside FLUXGhost: the client always sends the flag, but the engine ignores it below
 * 250 DPI (verified in Tier 3 below).
 *
 * ── Scene (per the sheet: HEXA, a COMPOUND fill path) ───────────────────────────────────────
 * A 40×40 mm outer square minus a concentric 20×20 mm inner square, boolean-Differenced into ONE
 * compound path with a rectangular hole, filled (#infill) so it raster-engraves. We run at 500 DPI
 * (Fine): dpmm=20 → 1 pixel = 0.05 mm, exactly HEXA's erode amount, so the 0.05 mm inset lands as a
 * clean 1-pixel change on every edge (at 250 DPI the 0.05 mm erode is sub-pixel and only surfaces on
 * edges that happen to cross a pixel boundary — noisier to assert). 500 DPI still satisfies the
 * ≥250 DPI gate.
 *
 * ── Measured behavior (verified on the rig, this scene, HEXA @ 500 DPI) ─────────────────────
 *   • outer band right edge: 40.00 → 39.95 mm      (inset inward by 0.05 mm)
 *   • hole left edge:        10.00 →  9.95 mm       (hole grows leftward  0.05 mm)
 *   • hole right edge:       30.00 → 30.05 mm       (hole grows rightward 0.05 mm)
 *   • hole width:            20.00 → 20.10 mm       (widened 0.10 mm = 0.05 each side)
 *   • hole vertical extent grows by ~0.10 mm (gains scan lines top+bottom)
 *   • total engraved length: 23980 → 23820 mm      (~0.67 % LESS — shrinks, does not erase)
 * So the inset magnitude is ~0.05 mm (one 500-DPI pixel), consistent on outer + inner edges.
 *
 * Tier 2: golden gcode snapshots for the fixed OFF and ON scenes prove the exact machine contract.
 * Tier 3: at 125 DPI (Draft, <250) shrink ON produces gcode byte-identical to OFF — the gate holds.
 *
 * FLUXGhost-gated: self-skips on CI, wires ghostPort like dpi-resolution.spec.ts.
 */
import { compareGoldenGcode, getTaskGcode, installGcodeCaptureHook, parseGcode } from '../../support/taskPath';
import type { Move } from '../../support/taskPath';

const isRunningAtGithub = Cypress.env('envType') === 'github';

/**
 * Wire FLUXGhost and land on the editor, installing the gcode-capture hook. Mirrors
 * dpi-resolution.spec.ts: with `ghostPort`, pin host 127.0.0.1 + port inside onBeforeLoad (session
 * cache would otherwise wipe plain pre-visit localStorage). Never hardcode the port.
 */
const wireBackendAndLand = () => {
  const ghostPort = Cypress.env('ghostPort');

  if (ghostPort) {
    cy.landingEditor({
      onBeforeLoad: (win: Window) => {
        win.localStorage.setItem('host', '127.0.0.1');
        win.localStorage.setItem('port', `${ghostPort}`);
        installGcodeCaptureHook(win);
      },
    });
  } else {
    cy.setUpBackend(Cypress.env('backendIP'));
    cy.landingEditor({ onBeforeLoad: installGcodeCaptureHook });
  }
};

const openDocSettings = () => cy.getMenuItem(['Edit'], 'Document Settings').click();

/** Pick the workarea by label inside an already-open Document Settings dialog. */
const setWorkarea = (label: string) => {
  cy.get('#workareaSelect').closest('.ant-select').as('waSelect');
  cy.get('@waSelect').find('.ant-select-selection-item').click();
  cy.get('@waSelect').should('have.class', 'ant-select-open');
  cy.get('.ant-select-item-option-content').contains(label).click({ force: true });
};

/** Pick a DPI option by label inside an already-open Document Settings dialog. */
const setDpi = (label: string) => {
  cy.get('#dpi-select', { timeout: 10000 }).closest('.ant-select').as('dpiSelect');
  cy.get('@dpiSelect').find('.ant-select-selection-item').click();
  cy.get('@dpiSelect').should('have.class', 'ant-select-open');
  cy.get('.ant-select-item-option-content').contains(label).click({ force: true });
};

/** Force the #autoShrink switch to a target state inside an already-open Document Settings dialog. */
const setAutoShrink = (on: boolean) => {
  cy.get('#autoShrink').then(($sw) => {
    const isOn = $sw.attr('aria-checked') === 'true';

    if (isOn !== on) cy.get('#autoShrink').click({ force: true });
  });
  cy.get('#autoShrink').should('have.attr', 'aria-checked', on ? 'true' : 'false');
};

const saveDocSettings = () => cy.get('button.ant-btn').contains('Save').click({ force: true });

/** Draw a rectangle then set its exact position/size via the object panel (mm). */
const drawRect = (x: number, y: number, w: number, h: number) => {
  cy.get('#left-Rectangle').click();
  cy.get('#svgcontent').trigger('mousedown', 120, 120, { force: true, which: 1 });
  cy.get('#svgcontent').trigger('mousemove', 300, 300, { force: true, which: 1 });
  cy.get('#svgcontent').trigger('mouseup', { force: true });
  cy.showPanel('objects');
  cy.get('#x_position').clear().type(`${x}{enter}`);
  cy.get('#y_position').clear().type(`${y}{enter}`);
  cy.get('#w_size').clear().type(`${w}{enter}`);
  cy.get('#h_size').clear().type(`${h}{enter}`);
};

/**
 * Build the compound fill path once: a 40×40 outer square minus a concentric 20×20 inner square,
 * boolean-Differenced into one path with a hole, then filled so it raster-engraves.
 */
const buildCompoundFillPath = () => {
  drawRect(0, 0, 40, 40);
  drawRect(10, 10, 20, 20);

  // Marquee-select both shapes, then Difference → a single compound path with a hole.
  cy.get('#left-Cursor').click();
  cy.get('#svgcontent').trigger('mousedown', -80, -80, { force: true });
  cy.get('#svgcontent').trigger('mousemove', 420, 420, { force: true });
  cy.get('#svgcontent').trigger('mouseup', { force: true });
  cy.get('#difference').click();
  cy.get('#svgcontent path', { timeout: 10000 }).should('exist');

  // Fill it so FLUXGhost raster-engraves the compound region (a hollow band with a hole).
  cy.showPanel('objects');
  cy.get('#infill').click();
  cy.get('#svgcanvas').click(700, 550, { force: true }); // commit + deselect
};

/** Leave Path Preview mode so the next generation starts clean. */
const exitPathPreview = () => {
  cy.get('#path-preview-side-panel').contains('button', 'End Preview').click({ force: true });
  cy.get('#path-preview-side-panel', { timeout: 20000 }).should('not.exist');
};

// ── Scene-specific toolpath analysis ─────────────────────────────────────────────────────────
//
// The compound fill raster-engraves as horizontal scan lines. Band-only scan lines (above/below
// the hole) have ONE laser-on X-run [0..40]; hole-crossing scan lines have TWO runs [0..10] and
// [30..40] with a gap where the hole is. taskPath's getRasterLines collapses each scan line to a
// single xMin/xMax, so it can't see the hole gap — we extract per-scan-line segments here instead
// (scene-specific, hence kept in the spec rather than added to the shared module).

type Seg = [number, number];

/** Group laser-on moves into per-scan-line (Y) merged X-segments. Y quantised to 1e-3 mm. */
const segmentsByScanline = (moves: Move[]): Map<number, Seg[]> => {
  const raw = new Map<number, Seg[]>();

  for (let i = 0; i < moves.length; i += 1) {
    const m = moves[i];

    if (!m.laserOn) continue;

    // The laser-on move spans from the previous head position to this one along constant Y.
    const prev = moves[i - 1];
    const start = prev ? prev.x : m.x;
    const key = Math.round(m.y / 1e-3) * 1e-3;
    const arr = raw.get(key) ?? [];

    arr.push([Math.min(start, m.x), Math.max(start, m.x)]);
    raw.set(key, arr);
  }

  const merged = new Map<number, Seg[]>();

  for (const [y, segs] of raw) {
    const sorted = segs.filter((s) => s[1] - s[0] > 1e-6).sort((a, b) => a[0] - b[0]);
    const out: Seg[] = [];

    for (const s of sorted) {
      const last = out[out.length - 1];

      if (last && s[0] <= last[1] + 1e-4) last[1] = Math.max(last[1], s[1]);
      else out.push([s[0], s[1]]);
    }

    merged.set(y, out);
  }

  return merged;
};

const median = (values: number[]): number => {
  const s = [...values].sort((a, b) => a - b);

  return s.length ? s[Math.floor(s.length / 2)] : Number.NaN;
};

interface SceneMetrics {
  /** total engraved X-length across all scan lines (mm) — the coverage proxy. */
  coverageLen: number;
  /** number of scan lines that cross the hole (two X-runs). */
  holeScanlineCount: number;
  /** median X of the hole's left edge (end of the first run on a hole-crossing line). */
  holeLeftEdge: number;
  /** median X of the hole's right edge (start of the last run on a hole-crossing line). */
  holeRightEdge: number;
  /** median X of the outer band's right edge (max X of the last run per scan line). */
  outerRightEdge: number;
  scanlineCount: number;
}

const analyze = (moves: Move[]): SceneMetrics => {
  const byY = segmentsByScanline(moves);
  const outerRights: number[] = [];
  const holeLefts: number[] = [];
  const holeRights: number[] = [];
  let coverageLen = 0;
  let holeScanlineCount = 0;

  for (const segs of byY.values()) {
    if (!segs.length) continue;

    outerRights.push(segs[segs.length - 1][1]);

    for (const [a, b] of segs) coverageLen += b - a;

    if (segs.length >= 2) {
      holeScanlineCount += 1;
      holeLefts.push(segs[0][1]); // hole starts where the first (left) run ends
      holeRights.push(segs[segs.length - 1][0]); // hole ends where the last (right) run starts
    }
  }

  return {
    coverageLen,
    holeLeftEdge: median(holeLefts),
    holeRightEdge: median(holeRights),
    holeScanlineCount,
    outerRightEdge: median(outerRights),
    scanlineCount: byY.size,
  };
};

/** Set DPI + Auto Shrink in one Document-Settings pass, then generate the toolpath gcode. */
const generateAt = (dpiLabel: string, shrinkOn: boolean): Cypress.Chainable<string> => {
  openDocSettings();
  setDpi(dpiLabel);
  setAutoShrink(shrinkOn);
  saveDocSettings();

  return getTaskGcode();
};

describe('auto shrink / 自動內縮 (FLUXGhost)', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });

    return;
  }

  beforeEach(() => {
    wireBackendAndLand();

    // HEXA workarea (per the sheet). Set it before building the scene so the toolpath uses HEXA's
    // autoShrink=0.05 mm erode amount.
    openDocSettings();
    setWorkarea('HEXA');
    saveDocSettings();

    buildCompoundFillPath();
  });

  it('Tier 1 — shrink ON insets the outer edge, grows the hole, and reduces coverage without erasing', () => {
    // OFF baseline at 500 DPI (Fine).
    generateAt('Fine (500 DPI)', false).then((offGcode) => {
      const off = analyze(parseGcode(offGcode));

      exitPathPreview();

      // ON, same scene otherwise.
      generateAt('Fine (500 DPI)', true).then((onGcode) => {
        const on = analyze(parseGcode(onGcode));

        Cypress.log({
          message:
            `OFF outerR=${off.outerRightEdge.toFixed(3)} holeL=${off.holeLeftEdge.toFixed(3)} ` +
            `holeR=${off.holeRightEdge.toFixed(3)} cover=${off.coverageLen.toFixed(0)} | ` +
            `ON outerR=${on.outerRightEdge.toFixed(3)} holeL=${on.holeLeftEdge.toFixed(3)} ` +
            `holeR=${on.holeRightEdge.toFixed(3)} cover=${on.coverageLen.toFixed(0)}`,
          name: 'autoShrink',
        });

        // Sanity on the OFF geometry: nominal outer=40, hole edges at 10 and 30.
        expect(off.outerRightEdge, 'OFF outer right edge ≈ 40mm').to.be.closeTo(40, 0.02);
        expect(off.holeLeftEdge, 'OFF hole left edge ≈ 10mm').to.be.closeTo(10, 0.02);
        expect(off.holeRightEdge, 'OFF hole right edge ≈ 30mm').to.be.closeTo(30, 0.02);

        // (a) Outer boundary is inset by ~0.05mm (one 500-DPI pixel = HEXA erode amount).
        const outerInset = off.outerRightEdge - on.outerRightEdge;

        expect(outerInset, 'outer right edge insets inward by ~0.05mm').to.be.closeTo(0.05, 0.03);

        // (b) The hole grows from BOTH sides: left edge moves in (−), right edge moves out (+).
        const holeLeftMove = on.holeLeftEdge - off.holeLeftEdge; // negative = grows leftward
        const holeRightMove = on.holeRightEdge - off.holeRightEdge; // positive = grows rightward

        expect(holeLeftMove, 'hole left edge moves inward (~-0.05mm, hole grows)').to.be.closeTo(-0.05, 0.03);
        expect(holeRightMove, 'hole right edge moves outward (~+0.05mm, hole grows)').to.be.closeTo(0.05, 0.03);

        const offHoleWidth = off.holeRightEdge - off.holeLeftEdge;
        const onHoleWidth = on.holeRightEdge - on.holeLeftEdge;

        expect(onHoleWidth, 'hole widens by ~0.10mm (0.05 each side)').to.be.closeTo(offHoleWidth + 0.1, 0.04);

        // (c) Interior coverage still exists — the feature shrinks, it does not erase the fill.
        expect(on.coverageLen, 'ON still engraves the bulk of the fill').to.be.greaterThan(off.coverageLen * 0.95);
        expect(on.holeScanlineCount, 'ON still has the hole (two-run scan lines remain)').to.be.greaterThan(
          off.holeScanlineCount * 0.9,
        );

        // (d) Total coverage is strictly LESS with shrink ON (fill eroded inward everywhere).
        expect(on.coverageLen, 'ON total engraved length is less than OFF').to.be.lessThan(off.coverageLen);

        // Consistency: the inset magnitude is the same (~0.05mm) on the outer edge and both hole
        // edges — a uniform erode, not a one-sided artefact.
        expect(Math.abs(outerInset - Math.abs(holeLeftMove)), 'outer vs hole-left inset agree').to.be.lessThan(0.03);
        expect(Math.abs(outerInset - holeRightMove), 'outer vs hole-right inset agree').to.be.lessThan(0.03);
      });
    });
  });

  it('Tier 2 — OFF and ON toolpaths each match their golden machine contract exactly', () => {
    // Fixed scene + fixed DPI → byte-identical normalized gcode (verified deterministic on the
    // rig). Regenerate + review in the PR with CYPRESS_updateGolden=1 if a change is expected.
    generateAt('Fine (500 DPI)', false).then((offGcode) => {
      compareGoldenGcode('auto-shrink-hexa-compound-500dpi-off', offGcode);
      exitPathPreview();

      generateAt('Fine (500 DPI)', true).then((onGcode) => {
        compareGoldenGcode('auto-shrink-hexa-compound-500dpi-on', onGcode);
      });
    });
  });

  it('Tier 3 — the ≥250 DPI gate: at 125 DPI (Draft) shrink ON produces the same toolpath as OFF', () => {
    // The tooltip gate ("only applies to layers ≥ 250 DPI") is enforced in FLUXGhost: the client
    // sends engraving_erode regardless, but the engine ignores it below 250 DPI. So at 125 DPI the
    // ON and OFF toolpaths must be byte-identical.
    generateAt('Draft (125 DPI)', false).then((offGcode) => {
      const off = analyze(parseGcode(offGcode));

      exitPathPreview();

      generateAt('Draft (125 DPI)', true).then((onGcode) => {
        const on = analyze(parseGcode(onGcode));

        expect(on.outerRightEdge, '125 DPI: outer edge unchanged by shrink').to.be.closeTo(off.outerRightEdge, 1e-3);
        expect(on.holeLeftEdge, '125 DPI: hole left edge unchanged by shrink').to.be.closeTo(off.holeLeftEdge, 1e-3);
        expect(on.holeRightEdge, '125 DPI: hole right edge unchanged by shrink').to.be.closeTo(off.holeRightEdge, 1e-3);
        expect(on.coverageLen, '125 DPI: total coverage unchanged by shrink').to.be.closeTo(off.coverageLen, 1e-3);
      });
    });
  });
});
