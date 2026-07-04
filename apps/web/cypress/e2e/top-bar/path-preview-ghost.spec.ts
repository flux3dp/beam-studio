const isRunningAtGithub = Cypress.env('envType') === 'github';

/**
 * Wire FLUXGhost and land on the editor for a single test. Copied verbatim from
 * top-bar/path-preview-toggles.spec.ts: when `ghostPort` is provided (a non-default FLUXGhost
 * port), pin the host to 127.0.0.1 (FLUXGhost rejects websocket upgrades whose Origin is
 * localhost) and the port to that value, written inside `onBeforeLoad` (plain pre-visit
 * localStorage writes are cleared by the `cy.session` cache inside `landingEditor`; passing
 * custom visit options makes `landingEditor` skip session caching and run the hook on every
 * load). Otherwise fall back to `cy.setUpBackend(backendIP)`.
 */
const wireBackendAndLand = () => {
  const ghostPort = Cypress.env('ghostPort');

  if (ghostPort) {
    cy.landingEditor({
      onBeforeLoad: (win: Window) => {
        win.localStorage.setItem('host', '127.0.0.1');
        win.localStorage.setItem('port', `${ghostPort}`);
      },
    });
  } else {
    cy.setUpBackend(Cypress.env('backendIP'));
    cy.landingEditor();
  }
};

/** Draw a rectangle by dragging on the canvas between two viewport-pixel corners. */
const drawRectAt = (x1: number, y1: number, x2: number, y2: number) => {
  cy.get('#left-Rectangle').click();
  cy.get('#svgcontent').trigger('mousedown', x1, y1, { force: true, which: 1 });
  cy.get('#svgcontent').trigger('mousemove', x2, y2, { force: true, which: 1 });
  cy.get('#svgcontent').trigger('mouseup', { force: true });
};

/**
 * Enter Path Preview mode and wait until FLUXGhost has finished the toolpath calculation (the
 * side panel drops its placeholder NaN values and the progress-bar slider is mounted). The
 * top-bar button is only visually disabled without a discovered machine; the click handler
 * still toggles the canvas mode, so a forced click enters preview with FLUXGhost only.
 */
const enterPathPreview = () => {
  cy.get('[title="Path Preview"]').click({ force: true });
  cy.get('#path-preview-panel', { timeout: 40000 }).should('exist');
  cy.get('#path-preview-side-panel', { timeout: 40000 }).should('exist');
  cy.get('#path-preview-side-panel', { timeout: 40000 }).should('not.contain', 'NaN');
  cy.get('#progress-bar input.slider', { timeout: 40000 }).should('exist');
};

/** Read the side-panel "Current Position" as `[x, y]` mm (NaN-safe). */
const readCurrentPosition = (): Cypress.Chainable<[number, number]> =>
  cy.get('#path-preview-side-panel').then(($p) => {
    const m = $p.text().match(/Current Position(-?[0-9]+), (-?[0-9]+) mm/);

    expect(m, 'current position matches "x, y mm"').to.not.be.null;

    return [Number(m![1]), Number(m![2])] as [number, number];
  });

/** Move the path-preview timeline slider to `frac` (0..1) of its range. */
const seekTimeline = (frac: number) => {
  cy.get('#progress-bar input.slider').then(($s) => {
    const max = Number(($s[0] as HTMLInputElement).max);

    cy.get('#progress-bar input.slider')
      .invoke('val', (max * frac).toFixed(4))
      .trigger('input')
      .trigger('change');
  });
};

/**
 * Parse an "h/m/s" duration string ("1 h 2 m 3 s", "43 s", "5 m 0 s", "1 h 30 m") to total
 * seconds. Both time surfaces format with the same h/m/s tokens (FormatDuration for the canvas
 * button, PathPreview.transferTime for the side panel), so one parser serves both.
 */
const parseHmsSeconds = (text: string): number => {
  const h = text.match(/(\d+)\s*h/);
  const m = text.match(/(\d+)\s*m/);
  const s = text.match(/(\d+)\s*s/);

  return (h ? Number(h[1]) * 3600 : 0) + (m ? Number(m[1]) * 60 : 0) + (s ? Number(s[1]) : 0);
};

describe('path preview (FLUXGhost)', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });

    return;
  }

  it('Start Here: control is present, timeline seeking updates position, and play toggles it', () => {
    wireBackendAndLand();
    // A vector scene so FLUXGhost produces a non-trivial toolpath.
    drawRectAt(100, 100, 340, 280);
    cy.get('#svg_1').should('exist');
    enterPathPreview();

    // In the web build Swiftray is never available (helpers/api/swiftray-client checkSwiftray
    // returns `!isWeb() && ...`), so getConvertEngine().useSwiftray is always false and the
    // Start Here button is always rendered. (The "Path Calculation Acceleration" preference that
    // would hide it lives behind a Swiftray-only toggle and is unreachable here — see the spec
    // report note.) Assert the button exists and starts enabled (playState === STOP).
    cy.get('#path-preview-side-panel').contains('button', 'Start Here').as('startHere');
    cy.get('@startHere').should('exist');
    cy.get('@startHere').should('not.be.disabled');

    // Freshly entered, the position cursor sits at the origin placeholder.
    readCurrentPosition().then(([x0, y0]) => {
      expect(x0, 'initial x').to.eq(0);
      expect(y0, 'initial y').to.eq(0);
    });

    // Seeking the timeline to a mid point picks the toolpath point that Start Here would resume
    // from: the side-panel Current Position must change to a real (non-origin) coordinate.
    seekTimeline(0.5);
    readCurrentPosition().then(([x, y]) => {
      expect(Math.abs(x) + Math.abs(y), 'position moved off origin after seeking').to.be.greaterThan(0);
    });

    // Start Here stays enabled while stopped/paused and is disabled only while playing
    // (isStartHereEnabled = playState !== PLAY). Play, assert disabled, then stop, assert enabled.
    cy.get('#path-preview-panel img[title="Play"]').click();
    cy.get('#path-preview-panel img[title="Pause"]', { timeout: 10000 }).should('exist');
    cy.get('@startHere').should('be.disabled');

    cy.get('#path-preview-panel img[title="Stop"]').click();
    cy.get('#path-preview-panel img[title="Play"]', { timeout: 10000 }).should('exist');
    cy.get('@startHere').should('not.be.disabled');
  });

  it('estimated time: path-preview side panel matches the canvas bottom-right estimate', () => {
    wireBackendAndLand();
    drawRectAt(100, 100, 340, 280);
    drawRectAt(160, 150, 210, 200);
    cy.get('#svg_2').should('exist');

    // Canvas bottom-right estimate: open the canvas-control dropdown, switch to "Estimate time",
    // then click the display to trigger ExportFuncs.estimateTime() (FLUXGhost fileTimeCost).
    cy.get('#svg_editor [class*="bottom-right"] .ant-dropdown-trigger').first().click({ force: true });
    cy.contains('.ant-dropdown-menu-item', 'Estimate time').click({ force: true });
    cy.get('[class*="timeDisplay"]', { timeout: 20000 }).should('exist').click({ force: true });
    cy.get('[class*="timeDisplay"]', { timeout: 40000 }).should('not.contain', 'Estimate time');

    cy.get('[class*="timeDisplay"]')
      .invoke('text')
      .then((canvasText) => {
        const canvasSeconds = parseHmsSeconds(canvasText);

        expect(canvasSeconds, 'canvas estimate parses to > 0 seconds').to.be.greaterThan(0);

        // Path-preview side panel "Total Time Estimated": both surfaces derive from the same
        // FLUXGhost fileTimeCost (side panel via timeDisplayRatio = fileTimeCost/(60*simTimeMax),
        // canvas via FormatDuration(fileTimeCost)); they differ only by h/m/s rounding.
        enterPathPreview();
        cy.get('#path-preview-side-panel')
          .invoke('text')
          .then((panelText) => {
            const est = panelText.match(/Total Time Estimated(.*?)Cut Time/);

            expect(est, 'side panel exposes Total Time Estimated').to.not.be.null;

            const panelSeconds = parseHmsSeconds(est![1]);

            expect(panelSeconds, 'side panel estimate parses to > 0 seconds').to.be.greaterThan(0);
            // Allow a couple seconds of formatting/rounding slack between the two surfaces.
            expect(panelSeconds, 'side panel vs canvas estimate').to.be.closeTo(canvasSeconds, 2);
          });
      });
  });

  it('cut order: inner enclosed rects are cut before the outer enclosing rect', () => {
    wireBackendAndLand();
    // ONE layer: a big enclosing rect plus three small closed rects drawn inside it.
    drawRectAt(80, 80, 360, 300); // outer enclosure
    drawRectAt(140, 130, 180, 170); // inner
    drawRectAt(220, 130, 260, 170); // inner
    drawRectAt(180, 210, 220, 250); // inner
    cy.get('#svg_4').should('exist');
    enterPathPreview();

    // Engine note: the web build never uses Swiftray (checkSwiftray -> !isWeb() is false), so this
    // exercises the FLUXGhost/beamify convert engine (fetchTaskCode). Swiftray on/off is not
    // switchable from the web app, so only the default (FLUXGhost) engine is covered here.

    // Sample Current Position along the toolpath timeline (ordered by simTime). The outer rect IS
    // the drawing's bounding box, so its perimeter sits on the extreme X/Y; the inner rects sit
    // strictly inside. Walk the ordered samples, derive the bounding box from all sampled points,
    // then assert an early sample is strictly interior while a late sample lies on the perimeter —
    // i.e. inner objects are visited before the outer enclosure.
    const fractions = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const points: Array<{ frac: number; x: number; y: number }> = [];

    cy.wrap(fractions).each((frac: number) => {
      seekTimeline(frac);
      readCurrentPosition().then(([x, y]) => {
        points.push({ frac, x, y });
      });
    });

    cy.then(() => {
      // Ignore any origin-placeholder readings (getSimTimeInfo returns [0,0] at exact boundaries).
      const real = points.filter((p) => p.x !== 0 || p.y !== 0);

      expect(real.length, 'collected real toolpath positions').to.be.greaterThan(4);

      const xs = real.map((p) => p.x);
      const ys = real.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const margin = 8; // mm tolerance for "on the bounding-box perimeter"
      const onPerimeter = (p: { x: number; y: number }) =>
        Math.abs(p.x - minX) <= margin ||
        Math.abs(p.x - maxX) <= margin ||
        Math.abs(p.y - minY) <= margin ||
        Math.abs(p.y - maxY) <= margin;

      // Order samples by time and find the first fraction that reaches the outer perimeter and the
      // last fraction that is still strictly interior.
      const sorted = [...real].sort((a, b) => a.frac - b.frac);
      const firstPerimeter = sorted.find(onPerimeter);
      const interior = sorted.filter((p) => !onPerimeter(p));

      expect(interior.length, 'at least one strictly-interior (inner-rect) sample exists').to.be.greaterThan(0);
      expect(firstPerimeter, 'the outer enclosure is reached at some point').to.not.be.undefined;

      const firstInteriorFrac = interior[0].frac;

      // Inner (interior) cuts must begin before the outer enclosure perimeter is first reached.
      expect(
        firstInteriorFrac,
        'inner-rect cutting starts before the outer enclosure',
      ).to.be.lessThan(firstPerimeter!.frac);
    });
  });
});
