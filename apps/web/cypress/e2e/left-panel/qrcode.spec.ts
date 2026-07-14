// Code Generator (QR code / Barcode) - release-test sheet rows 58, 219-220.
// Entry point is the left-panel "Generators" drawer button (#left-Generator),
// which opens the Generators drawer; the "Code Generator" item opens the dialog.
// The feature is fully client-side (no FLUXGhost / machine needed), so it runs in CI.

const openCodeGenerator = () => {
  // Generator is a drawer-toggle button, not a mouse-mode tool, so skip the active check.
  cy.clickToolBtn('Generator', false);
  cy.contains('[role="button"]', 'Code Generator').should('be.visible').click();
  cy.get('.ant-modal-content').should('be.visible');
  cy.contains('.ant-modal-title', 'Code Generator').should('exist');
};

// The QR/Barcode value fields are controlled inputs with an onKeyDown stopPropagation
// handler; a single fast cy.type() desyncs and only the first character survives. Typing
// one character per command lets React commit each keystroke, which is reliable.
const typeValue = (selector: string, value: string) => {
  cy.get(selector).first().click();
  value.split('').forEach((ch) => cy.get(selector).first().type(ch));
  cy.get(selector).first().should('have.value', value);
};

// Switch the dialog between QR / Barcode mode via the <Segmented> at the top of the form.
const selectMode = (label: 'Barcode' | 'QR Code') =>
  cy.contains('.ant-segmented-item', label).click();

// The "Invert background color" control is a <Switch> next to its label span; click the
// switch scoped to that label so we don't hit the variable-text or barcode "Text" switches.
const toggleInvert = () =>
  cy.contains('.ant-modal-content span', 'Invert background color').siblings('button.ant-switch').click();

// The antd <QRCode type="svg"> renders inside #qrcode-container as two <path>s: a
// background rect-path (fill = bgColor) and the foreground module path (fill = fgColor).
// In normal mode fgColor is "black", so grab that path's `d` to assert the output changes.
const getQrPathData = () =>
  cy
    .get('#qrcode-container svg:not(:empty) path[fill="black"]', { timeout: 15000 })
    .should('have.attr', 'd')
    .then((d) => `${d}`);

// On confirm, the code is imported as a layer: a <use data-svg="true"> element that
// references a rasterized "*_image" symbol lands inside the current layer of #svgcontent.
// Ids (svg_1 / svg_2 ...) depend on the id counter, so assert on the stable structure.
const assertCodeOnCanvas = () => {
  cy.get('#svgcontent g.layer use[data-svg="true"]', { timeout: 15000 })
    .should('have.length', 1)
    .and(($use) => {
      const href = $use.attr('xlink:href') || $use.attr('href') || '';

      expect(href, 'imported use references an image symbol').to.match(/#svg_\d+_image$/);
    });
};

describe('qrcode', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('generates a QR code onto the canvas', () => {
    openCodeGenerator();

    // Import is disabled until there is content.
    cy.contains('.ant-modal-footer button', 'Import').should('be.disabled');

    typeValue('.ant-modal-content textarea', 'https://flux3dp.com');

    // Preview renders a non-empty svg with a black code path (content correctness).
    getQrPathData().should('have.length.greaterThan', 10);

    cy.contains('.ant-modal-footer button', 'Import').should('not.be.disabled').click();

    // handleOk awaits the import before closing, so once the modal is gone the element exists.
    cy.get('.ant-modal-content').should('not.exist');
    cy.waitForProgress();
    assertCodeOnCanvas();
  });

  it('changes output when switching error-tolerance level', () => {
    openCodeGenerator();

    // For this value qrcodegen picks version 1 (25x25) at level L but a larger version
    // (29x29) at level H, so L -> H is guaranteed to change and grow the generated path.
    typeValue('.ant-modal-content textarea', 'https://flux3dp.com');

    // Baseline at default level L (7%).
    cy.contains('.ant-segmented-item', '7%').should('exist');

    getQrPathData().then((low) => {
      expect(low.length).to.be.greaterThan(10);

      // Switch to the highest error-tolerance level H (30%).
      cy.contains('.ant-segmented-item', '30%').click();
      getQrPathData().should((high) => {
        expect(high).to.not.equal(low);
        expect(high.length).to.be.greaterThan(low.length);
      });

      // Switching back to L restores the original output (setting is applied both ways).
      cy.contains('.ant-segmented-item', '7%').click();
      getQrPathData().should('equal', low);
    });
  });

  it('changes output when inverting background color', () => {
    openCodeGenerator();
    typeValue('.ant-modal-content textarea', 'invert-me');

    // Baseline: foreground modules drawn in black over a transparent background.
    cy.get('#qrcode-container svg:not(:empty) path[fill="black"]').should('exist');
    cy.get('#qrcode-container svg:not(:empty) path[fill="transparent"]').should('exist');

    toggleInvert();

    // Inverting swaps the fills: foreground modules become white on a black background.
    // (The module geometry `d` is unchanged, so we assert on fill color, not on `d`.)
    cy.get('#qrcode-container svg:not(:empty) path[fill="white"]').should('exist');
    cy.get('#qrcode-container svg:not(:empty) path[fill="black"]').should('exist');
    cy.get('#qrcode-container svg:not(:empty) path[fill="transparent"]').should('not.exist');

    toggleInvert();

    // Toggling back restores the original fg/bg fills.
    cy.get('#qrcode-container svg:not(:empty) path[fill="black"]').should('exist');
    cy.get('#qrcode-container svg:not(:empty) path[fill="transparent"]').should('exist');
    cy.get('#qrcode-container svg:not(:empty) path[fill="white"]').should('not.exist');
  });

  it('generates a barcode onto the canvas', () => {
    openCodeGenerator();

    // Switch the dialog to Barcode mode via the mode <Segmented>.
    selectMode('Barcode');

    // In barcode mode the value field is the shared content textarea (same as QR mode).
    typeValue('.ant-modal-content textarea', '123456');

    // JsBarcode renders <rect> bars into #barcode (non-empty output).
    cy.get('#barcode rect', { timeout: 15000 }).should('have.length.greaterThan', 1);

    cy.contains('.ant-modal-footer button', 'Import').should('not.be.disabled').click();

    cy.get('.ant-modal-content').should('not.exist');
    cy.waitForProgress();
    assertCodeOnCanvas();
  });
});
