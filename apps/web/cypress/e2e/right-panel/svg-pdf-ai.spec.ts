const isRunningAtGithub = Cypress.env('envType') === 'github';

const layerListPrefix =
  '_-_-packages-core-src-web-app-components-beambox-RightPanel-LayerPanel-LayerList-module__';
const colorPickerPrefix = '_-_-packages-core-src-web-app-widgets-ColorPicker-module__';
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

/** Answer the "Select layering style:" import popup. */
const selectLayering = (layering: 'Color' | 'Layer' | 'Single Layer') => {
  cy.contains('.ant-modal-content', 'Select layering style:').as('layeringModal');
  cy.get('@layeringModal').contains(layering).click();
  cy.get('@layeringModal').contains('OK').click();
};

/** SVG parsing runs over the FLUXGhost websocket; wait out the nonstop progress overlay. */
const waitImportDone = () =>
  cy.get(`div[class*="${progressPrefix}nonstop--"`, { timeout: 60000 }).should('not.exist');

const uploadSvgFixture = () => {
  cy.uploadFile('svg.svg', 'image/svg+xml');
  // The nonstop progress overlay appears while FLUXGhost parses the SVG.
  cy.get(`div[class*="${progressPrefix}nonstop--"`, { timeout: 30000 }).should('exist');
};

describe('svg / pdf / ai import layering & color', () => {
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

  it('import svg by layer with printing module then change object color', () => {
    uploadSvgFixture();

    // Ador supports a printing module, so the module popup is shown; pick Printing.
    selectModule('Printing');

    // For a printing module the layering popup offers Layer + Single Layer (no Color option).
    cy.contains('.ant-modal-content', 'Select layering style:').as('layeringModal');
    cy.get('@layeringModal').contains('Layer').should('exist');
    cy.get('@layeringModal').contains('Single Layer').should('exist');
    cy.get('@layeringModal').contains('Color').should('not.exist');
    cy.get('@layeringModal').contains('Layer').click();
    cy.get('@layeringModal').contains('OK').click();
    waitImportDone();

    // By-layer import keeps the source SVG layer names, one full-color printing layer each.
    cy.get('use#svg_2').should('exist');
    cy.get('use#svg_4').should('exist');
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '圖層 1');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '預設圖層');
    cy.get('g.layer[data-fullcolor="1"][data-module="5"]').should('have.length', 2);

    // Select only the imported ellipse and change its color from the object options panel.
    cy.get('#svgcanvas').click(600, 500, { force: true });
    cy.getElementTitle().should('not.exist');
    cy.get('use#svg_4').click({ force: true });
    cy.getElementTitle().should('contain.text', 'SVG Object');
    cy.showPanel('objects');
    cy.get(`div[class*="${colorPickerPrefix}color"]`).should(
      'have.attr',
      'style',
      'background: rgb(63, 81, 181);',
    );
    cy.get(`div[class*="${colorPickerPrefix}color"]`).click();
    cy.get(`div[class*="${colorPickerPrefix}inner"][style="background-color: rgb(22, 119, 255);"]`).click();
    cy.get(`div[class*="${colorPickerPrefix}footer"]`).find('.ant-btn').contains('OK').click();

    // The new color is applied to both the swatch and the underlying symbol content.
    cy.get(`div[class*="${colorPickerPrefix}color"]`).should(
      'have.attr',
      'style',
      'background: rgb(22, 119, 255);',
    );
    cy.get('symbol#svg_3 path[fill="#1677FF"]').should('exist');
  });

  it('import svg by color with laser module then adjust a layer color', () => {
    uploadSvgFixture();

    selectModule('Laser');

    // For a laser module the layering popup offers the Color option; import by color.
    cy.contains('.ant-modal-content', 'Select layering style:').as('layeringModal');
    cy.get('@layeringModal').contains('Color').should('exist');
    cy.get('@layeringModal').contains('Color').click();
    cy.get('@layeringModal').contains('OK').click();
    waitImportDone();

    // Import splits by source color into two layers named after their hex color.
    cy.get('#svg_2').should('exist');
    cy.get(`div[class*="${layerListPrefix}row"]`).eq(0).should('have.attr', 'data-layer', '#3F51B5');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '#3F51B5');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '#333333');

    // The top color layer's swatch starts at indigo (#3F51B5).
    cy.get(`div[class*="${layerListPrefix}row"]`)
      .eq(0)
      .find(`div[class*="${colorPickerPrefix}color"]`)
      .should('have.attr', 'style', 'background: rgb(63, 81, 181);');

    // Adjust that layer's color via the LayerList color swatch. Laser layers use the
    // `objects` preset palette (e.g. #1677FF), so pick a swatch from that set.
    cy.get(`div[class*="${layerListPrefix}row"]`)
      .eq(0)
      .find(`div[class*="${colorPickerPrefix}color"]`)
      .click({ force: true });
    cy.get(`div[class*="${colorPickerPrefix}inner"][style="background-color: rgb(22, 119, 255);"]`).click();
    cy.get('.ant-btn').contains('OK').click();

    // The color change is reflected on both the swatch and the layer element.
    cy.get(`div[class*="${layerListPrefix}row"]`)
      .eq(0)
      .find(`div[class*="${colorPickerPrefix}color"]`)
      .should('have.attr', 'style', 'background: rgb(22, 119, 255);');
    cy.get('g.layer[data-color="#1677FF"]').should('exist');
  });

  it('shows module popup then full-color layers when choosing the printing head', () => {
    uploadSvgFixture();

    // The module popup offers both the laser and printing heads.
    cy.contains('.ant-modal-content', 'Select Module:').as('moduleModal');
    cy.get('@moduleModal').contains('Laser').should('exist');
    cy.get('@moduleModal').contains('Printing').should('exist');
    cy.get('@moduleModal').contains('Printing').click();
    cy.get('@moduleModal').contains('OK').click();

    // Choosing the printing head still pops the layering-style dialog.
    selectLayering('Layer');
    waitImportDone();

    // Choosing the printing head produces full-color (彩色) printing layers: they carry the
    // printing module + fullcolor flags and show the full-color icon instead of a color picker.
    cy.get('use#svg_2').should('exist');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '圖層 1');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '預設圖層');
    cy.get('g.layer[data-fullcolor="1"][data-module="5"]').should('have.length', 2);
    cy.get(`div[class*="${layerListPrefix}row"] div[class*="${colorPickerPrefix}trigger"]`).should('not.exist');
  });
});
