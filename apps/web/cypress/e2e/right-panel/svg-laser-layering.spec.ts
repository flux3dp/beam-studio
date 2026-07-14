const isRunningAtGithub = Cypress.env('envType') === 'github';

const layerListPrefix =
  '_-_-packages-core-src-web-app-components-beambox-RightPanel-LayerPanel-LayerList-module__';
const progressPrefix = '_-_-packages-core-src-web-app-components-dialogs-AlertAndProgress-module__';

/**
 * Wire FLUXGhost and land on the editor for a single test.
 *
 * Local rig convention: when `ghostPort` is provided (a non-default FLUXGhost port), pin the
 * host to 127.0.0.1 (FLUXGhost rejects websocket upgrades whose Origin is localhost) and the
 * port to that value. They must be written inside `onBeforeLoad`: plain pre-visit localStorage
 * writes are cleared by the `cy.session` cache inside `landingEditor`, while passing custom
 * visit options makes `landingEditor` skip session caching and run the hook on every load.
 * Otherwise fall back to the gated-spec convention of `cy.setUpBackend(backendIP)`.
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

/** Answer the "Select Module:" import popup. */
const selectModule = (module: 'Laser' | 'Printing') => {
  cy.contains('.ant-modal-content', 'Select Module:').as('moduleModal');
  cy.get('@moduleModal').contains(module).click();
  cy.get('@moduleModal').contains('OK').click();
};

/** SVG parsing runs over the FLUXGhost websocket; wait out the nonstop progress overlay. */
const waitImportDone = () =>
  cy.get(`div[class*="${progressPrefix}nonstop--"`, { timeout: 60000 }).should('not.exist');

const uploadSvgFixture = () => {
  cy.uploadFile('svg.svg', 'image/svg+xml');
  // The nonstop progress overlay appears while FLUXGhost parses the SVG.
  cy.get(`div[class*="${progressPrefix}nonstop--"`, { timeout: 30000 }).should('exist');
};

describe('svg import laser-module layering (Ador)', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });

    return;
  }

  beforeEach(() => {
    wireBackendAndLand();
    cy.changeWorkarea('Ador');
  });

  it('import svg by layer with laser module keeps source layers as laser modules', () => {
    uploadSvgFixture();

    selectModule('Laser');

    // For a laser module the layering popup offers all three options.
    cy.contains('.ant-modal-content', 'Select layering style:').as('layeringModal');
    cy.get('@layeringModal').contains('Layer').should('exist');
    cy.get('@layeringModal').contains('Color').should('exist');
    cy.get('@layeringModal').contains('Single Layer').should('exist');
    cy.get('@layeringModal').contains('Layer').click();
    cy.get('@layeringModal').contains('OK').click();
    waitImportDone();

    // By-layer import keeps the two source SVG layer names, imported as use/symbol structure.
    cy.get('use#svg_2').should('exist');
    cy.get('use#svg_4').should('exist');
    cy.get('symbol').should('have.length.at.least', 2);
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '圖層 1');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '預設圖層');

    // Both imported layers are laser modules: no printing module (5) and no full-color flag.
    cy.get('g.layer[data-module]').should('have.length.at.least', 2);
    cy.get('g.layer[data-module="5"]').should('not.exist');
    cy.get('g.layer[data-fullcolor="1"]').should('not.exist');
  });

  it('import svg by color with laser module splits into color layers', () => {
    // Color-layer splitting is asserted in depth in svg-pdf-ai.spec.ts
    // ("import svg by color with laser module then adjust a layer color").
    // Here we only confirm the by-color option works for the laser module to complete this row.
    uploadSvgFixture();

    selectModule('Laser');

    cy.contains('.ant-modal-content', 'Select layering style:').as('layeringModal');
    cy.get('@layeringModal').contains('Color').click();
    cy.get('@layeringModal').contains('OK').click();
    waitImportDone();

    // Splits by source color into two layers named after their hex color, both laser modules.
    cy.get('#svg_2').should('exist');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '#3F51B5');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '#333333');
    cy.get('g.layer[data-module="5"]').should('not.exist');
    cy.get('g.layer[data-fullcolor="1"]').should('not.exist');
  });

  it('import svg with single layer collapses everything into one laser layer', () => {
    uploadSvgFixture();

    selectModule('Laser');

    cy.contains('.ant-modal-content', 'Select layering style:').as('layeringModal');
    cy.get('@layeringModal').contains('Single Layer').click();
    cy.get('@layeringModal').contains('OK').click();
    waitImportDone();

    // Everything lands in the single default layer (no source layer names created).
    cy.get('use#svg_2').should('exist');
    // Single-layer import drops everything into the pre-existing default layer ("Layer 1"),
    // rather than creating layers named after the source SVG layers.
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.length', 1);
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', 'Layer 1');

    // The single layer is a laser module (not printing / not full-color).
    cy.get('g.layer[data-module]').should('have.length', 1);
    cy.get('g.layer[data-module="5"]').should('not.exist');
    cy.get('g.layer[data-fullcolor="1"]').should('not.exist');

    // Verify the imported geometry concretely: single-layer import merges the two source
    // shapes (rect + ellipse) into ONE imported use element referencing a symbol.
    cy.get('#svgcontent use').should('have.length', 1);
    cy.get('symbol').should('exist');

    // The merged import (svg_2) keeps its combined geometry. In source units the rect spans
    // x[121.6..421.6] and the ellipse x[122.3..322.3] => ~300 units (~30mm) wide; both span
    // y[105.8..305.8] => 200 units (~20mm) tall (100 units = 10mm at the 740mm/7400 scale).
    cy.get('use#svg_2').click({ force: true });
    cy.getElementTitle().should('contain.text', 'SVG Object');
    cy.showPanel('objects');
    cy.inputValueCloseTo('#w_size', 30, 1);
    cy.inputValueCloseTo('#h_size', 20, 1);
  });
});
