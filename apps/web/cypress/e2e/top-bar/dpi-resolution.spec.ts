/**
 * Engrave DPI / resolution (release-test sheet 文件設定 row:
 *   「以不同 DPI 雕刻點陣圖確認解析度功能是否正常（點陣圖需開啟漸層）」)
 *
 * Path-based verification (see .claude/skills/e2e-test/SKILL.md → "Path-based verification"): the DPI
 * setting changes the GENERATED TOOLPATH, not any UI state, so we assert against the FLUXGhost
 * gcode via cypress/support/taskPath.ts rather than the canvas.
 *
 * The resolution contract for a raster (漸層/gradient) engrave:
 *   • scan-line SPACING == 1/dpmm mm  (medium dpmm=10 → 0.1mm; high dpmm=20 → 0.05mm)
 *   • scan-line COUNT scales with dpmm (high ≈ 2× medium for the same bounding box)
 *   • the engraved bounding box is unchanged by DPI
 * dpmm = engrave DPI / 25.4; values from @core/app/constants/resolutions (low=125/5, medium=250/10,
 * high=500/20). A bitmap imports with data-shading:true (gradient ON) by default, satisfying the
 * "點陣圖需開啟漸層" precondition.
 *
 * Tier 2: one golden gcode snapshot at a fixed DPI proves the exact machine contract is stable.
 *
 * FLUXGhost-gated: self-skips on CI, wires ghostPort like svg-pdf-ai.spec.ts.
 */
import {
  compareGoldenGcode,
  getBBox,
  getRasterLines,
  getTaskGcode,
  installGcodeCaptureHook,
  parseGcode,
} from '../../support/taskPath';

const isRunningAtGithub = Cypress.env('envType') === 'github';

/**
 * Wire FLUXGhost and land on the editor, installing the gcode-capture hook. Mirrors
 * svg-pdf-ai.spec.ts: with `ghostPort`, pin host 127.0.0.1 + port inside onBeforeLoad (session
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

/**
 * Import the gradient bitmap and resize it to ~`sizeMm` (aspect-locked) for a fast conversion and
 * a compact golden. flux.png imports with gradient (data-shading) ON by default.
 */
const importGradientBitmap = (sizeMm: number) => {
  cy.uploadImage('flux.png');
  cy.get('#svg_1', { timeout: 20000 }).should('exist').and('have.attr', 'data-shading', 'true');
  cy.get('#svg_1').click({ force: true });
  cy.showPanel('objects');

  // Lock the aspect ratio, then set width; height follows. #w_size is the object-panel UnitInput.
  cy.get('#lock').then(($lock) => {
    if ($lock.attr('data-ratiofixed') !== 'true' && !$lock.find('[data-ratiofixed="true"]').length) {
      // RatioLock toggles data-ratiofixed on the element; click to lock if not already locked.
      cy.get('#lock').click({ force: true });
    }
  });
  cy.get('#w_size').clear({ force: true }).type(`${sizeMm}{enter}`, { force: true });
  cy.get('#svgcanvas').click(700, 550, { force: true }); // commit + deselect
};

/** Open Document Settings, pick a DPI option by label, save. Same select idiom as changeWorkarea. */
const setEngraveDpi = (optionLabel: string) => {
  cy.getMenuItem(['Edit'], 'Document Settings').click();
  cy.get('#dpi-select', { timeout: 10000 }).closest('.ant-select').as('dpiSelect');
  cy.get('@dpiSelect').find('.ant-select-selection-item').click();
  cy.get('@dpiSelect').should('have.class', 'ant-select-open');
  cy.get('.ant-select-item-option-content').contains(optionLabel).click({ force: true });
  cy.get('button.ant-btn').contains('Save').click({ force: true });
};

/** Leave Path Preview mode (the "End Preview" button) so the next generation starts clean. */
const exitPathPreview = () => {
  cy.get('#path-preview-side-panel').contains('button', 'End Preview').click({ force: true });
  cy.get('#path-preview-side-panel', { timeout: 20000 }).should('not.exist');
};

interface DpiMetrics {
  bboxHeight: number;
  bboxWidth: number;
  lineCount: number;
  spacingMean: number;
}

/** Generate the toolpath at a DPI and return the derived raster metrics + the raw gcode. */
const metricsAt = (optionLabel: string): Cypress.Chainable<{ gcode: string; metrics: DpiMetrics }> => {
  setEngraveDpi(optionLabel);

  return getTaskGcode().then((gcode) => {
    const moves = parseGcode(gcode);
    const raster = getRasterLines(moves);
    const bbox = getBBox(moves);

    Cypress.log({
      message:
        `${optionLabel}: lines=${raster.count} spacing≈${raster.spacingMean.toFixed(4)}mm ` +
        `bbox=${bbox.width.toFixed(2)}×${bbox.height.toFixed(2)}mm`,
      name: 'dpiMetrics',
    });

    return {
      gcode,
      metrics: {
        bboxHeight: bbox.height,
        bboxWidth: bbox.width,
        lineCount: raster.count,
        spacingMean: raster.spacingMean,
      },
    };
  });
};

describe('engrave DPI resolution (FLUXGhost)', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });

    return;
  }

  it('Tier 1 — raster scan-line count scales with DPI, spacing halves, bbox stays constant', () => {
    wireBackendAndLand();
    importGradientBitmap(20);

    // Medium (250 DPI, dpmm=10 → 0.1mm spacing).
    metricsAt('Standard (250 DPI)').then(({ metrics: med }) => {
      exitPathPreview();

      // High (500 DPI, dpmm=20 → 0.05mm spacing).
      metricsAt('Fine (500 DPI)').then(({ metrics: high }) => {
        // Spacing is the inverse of dpmm: medium ≈ 0.1mm, high ≈ 0.05mm.
        expect(med.spacingMean, 'medium scan-line spacing ≈ 1/dpmm = 0.1mm').to.be.closeTo(0.1, 0.02);
        expect(high.spacingMean, 'high scan-line spacing ≈ 1/dpmm = 0.05mm').to.be.closeTo(0.05, 0.01);
        expect(high.spacingMean, 'high spacing is ~half of medium').to.be.closeTo(med.spacingMean / 2, 0.02);

        // Scan-line count scales with dpmm: high ≈ 2× medium (±15%).
        expect(med.lineCount, 'medium produced raster scan lines').to.be.greaterThan(20);
        expect(high.lineCount, 'high ≈ 2× medium scan lines (±15%)').to.be.closeTo(
          med.lineCount * 2,
          med.lineCount * 2 * 0.15,
        );

        // Bounding box is a property of the artwork, not the DPI — it must not change.
        expect(high.bboxWidth, 'bbox width unchanged by DPI').to.be.closeTo(med.bboxWidth, 1);
        expect(high.bboxHeight, 'bbox height unchanged by DPI').to.be.closeTo(med.bboxHeight, 1);
      });
    });
  });

  it('Tier 2 — medium-DPI toolpath matches the golden machine contract exactly', () => {
    wireBackendAndLand();
    importGradientBitmap(20);

    // Fixed scene + fixed DPI → byte-identical normalized gcode (verified deterministic on the
    // rig). Regenerate + review in the PR with CYPRESS_updateGolden=1 if a change is expected.
    metricsAt('Standard (250 DPI)').then(({ gcode }) => {
      compareGoldenGcode('dpi-resolution-flux-20mm-medium', gcode);
    });
  });
});
