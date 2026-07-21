const isRunningAtGithub = Cypress.env('envType') === 'github';

const zoomBlockPrefix = '_-_-packages-core-src-web-app-components-common-ZoomBlock-module_';

/**
 * Wire FLUXGhost and land on the editor for a single test.
 *
 * Local rig convention (mirrors right-panel/svg-pdf-ai.spec.ts): when `ghostPort` is provided
 * (a non-default FLUXGhost port), pin the host to 127.0.0.1 (FLUXGhost rejects websocket
 * upgrades whose Origin is localhost) and the port to that value. They must be written inside
 * `onBeforeLoad`: plain pre-visit localStorage writes are cleared by the `cy.session` cache
 * inside `landingEditor`, while passing custom visit options makes `landingEditor` skip session
 * caching and run the hook on every load. Otherwise fall back to the gated-spec convention of
 * `cy.setUpBackend(backendIP)`.
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

/**
 * Draw a simple vector rectangle so the canvas is non-empty (Path Preview refuses to enter an
 * empty canvas) and the toolpath calculation has something to convert.
 */
const drawRect = () => {
  cy.get('#left-Rectangle').click();
  cy.get('#svgcontent').trigger('mousedown', 100, 100, { force: true, which: 1 });
  cy.get('#svgcontent').trigger('mousemove', 320, 260, { force: true, which: 1 });
  cy.get('#svgcontent').trigger('mouseup', { force: true });
  cy.get('#svg_1').should('exist');
};

/**
 * Enter Path Preview mode and wait until FLUXGhost has finished the toolpath calculation
 * (side panel drops its placeholder NaN values and the WebGL tools panel is mounted).
 */
const enterPathPreview = () => {
  // The top-bar button is only visually disabled without a discovered machine; the click
  // handler still toggles the canvas mode, so a forced click enters preview with FLUXGhost only.
  cy.get('[title="Path Preview"]').click({ force: true });
  cy.get('#path-preview-panel', { timeout: 40000 }).should('exist');
  cy.get('#path-preview-side-panel', { timeout: 40000 }).should('exist');
  cy.get('#path-preview-side-panel', { timeout: 40000 }).should('not.contain', 'NaN');
  cy.get('#show_traversal', { timeout: 40000 }).should('exist');
  cy.get('#invert_color').should('exist');
};

// The Path Preview ZoomBlock is nested inside #path-preview-panel; scope every ZoomBlock query
// there so the (hidden) main-canvas ZoomBlock is never matched.
const previewRatioText = () =>
  cy.get(`#path-preview-panel [class*="${zoomBlockPrefix}_ratio"]`);
const previewZoomIn = () =>
  cy.get(`#path-preview-panel [class*="${zoomBlockPrefix}_container"] img[src="img/icon-plus.svg"]`).parent();
const previewZoomOut = () =>
  cy.get(`#path-preview-panel [class*="${zoomBlockPrefix}_container"] img[src="img/icon-minus.svg"]`).parent();

describe('path preview toggles', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });

    return;
  }

  beforeEach(() => {
    wireBackendAndLand();
    drawRect();
    enterPathPreview();
  });

  it('toggles Travel Path and reflects the switch + traversal drawing state', () => {
    // The Travel Path switch drives workspace.showTraversal, which is fed straight into the
    // WebGL draw call (drawScene / drawTaskPreview showTraversal arg). It starts on.
    cy.get('#show_traversal').should('have.class', 'ant-switch-checked');
    cy.get('#show_traversal').should('have.attr', 'aria-checked', 'true');

    // Turn it off.
    cy.get('#show_traversal').click();
    cy.get('#show_traversal').should('not.have.class', 'ant-switch-checked');
    cy.get('#show_traversal').should('have.attr', 'aria-checked', 'false');

    // Turn it back on.
    cy.get('#show_traversal').click();
    cy.get('#show_traversal').should('have.class', 'ant-switch-checked');
    cy.get('#show_traversal').should('have.attr', 'aria-checked', 'true');
  });

  it('toggles Invert Color and reflects the switch state', () => {
    // The Invert switch drives state.isInverting, which is passed as the isInverting uniform to
    // the fragment shader (black vs white background) in every draw pass. It starts off.
    cy.get('#invert_color').should('not.have.class', 'ant-switch-checked');
    cy.get('#invert_color').should('have.attr', 'aria-checked', 'false');

    // Turn it on.
    cy.get('#invert_color').click();
    cy.get('#invert_color').should('have.class', 'ant-switch-checked');
    cy.get('#invert_color').should('have.attr', 'aria-checked', 'true');

    // Turn it back off.
    cy.get('#invert_color').click();
    cy.get('#invert_color').should('not.have.class', 'ant-switch-checked');
    cy.get('#invert_color').should('have.attr', 'aria-checked', 'false');

    // Toggling Invert must not disturb the Travel Path switch.
    cy.get('#show_traversal').should('have.class', 'ant-switch-checked');
  });

  it('zooms in/out inside preview and keeps the ratio position consistent', () => {
    previewZoomIn().should('exist');
    previewZoomOut().should('exist');

    // Capture the base ratio, then click zoom-in and assert the new ratio grew. Each step is
    // sequenced through `.then()` so the click has settled before the next ratio is read (the
    // cross-`.should()`-closure pattern races the retryable assertion against a stale value).
    previewRatioText()
      .invoke('text')
      .then((baseText) => {
        const baseRatio = parseInt(baseText.replace('%', ''), 10);

        expect(baseRatio, 'base ratio').to.be.greaterThan(0);

        // Zoom in: the preview camera scale grows, so the displayed ratio increases.
        previewZoomIn().click();
        previewRatioText()
          .should('not.have.text', baseText)
          .invoke('text')
          .then((inText) => {
            const zoomedInRatio = parseInt(inText.replace('%', ''), 10);

            expect(zoomedInRatio, 'zoomed-in ratio > base').to.be.greaterThan(baseRatio);

            // Zoom out from the higher level: the ratio drops back below the zoomed-in value and
            // lands back near the base. The ZoomBlock snaps to a fixed 10%-grid (zoomIn rounds up
            // to the next boundary, zoomOut down to the previous one), so the round trip settles
            // within one grid step of the starting ratio rather than exactly on it.
            previewZoomOut().click();
            previewRatioText()
              .should('not.have.text', inText)
              .invoke('text')
              .then((outText) => {
                const zoomedOutRatio = parseInt(outText.replace('%', ''), 10);

                expect(zoomedOutRatio, 'zoomed-out ratio < zoomed-in').to.be.lessThan(zoomedInRatio);
                expect(zoomedOutRatio, 'zoomed-out ratio near base').to.be.closeTo(baseRatio, 10);
              });
          });
      });
  });
});
