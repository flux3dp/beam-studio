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

// The antd <QRCode type="svg"> renders inside #qrcode-container. Grab the black
// "code" path's `d` attribute so we can assert the generated output changes.
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

    // Confirm is disabled until there is content.
    cy.contains('.ant-modal-footer button', 'Confirm').should('be.disabled');

    typeValue('.ant-modal-content textarea', 'https://flux3dp.com');

    // Preview renders a non-empty svg with a black code path (content correctness).
    getQrPathData().should('have.length.greaterThan', 10);

    cy.contains('.ant-modal-footer button', 'Confirm').should('not.be.disabled').click();

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
    cy.contains('.ant-radio-wrapper, .ant-radio-button-wrapper', '7%').should('exist');

    getQrPathData().then((low) => {
      expect(low.length).to.be.greaterThan(10);

      // Switch to the highest error-tolerance level H (30%).
      cy.contains('.ant-radio-wrapper, .ant-radio-button-wrapper', '30%').click();
      getQrPathData().should((high) => {
        expect(high).to.not.equal(low);
        expect(high.length).to.be.greaterThan(low.length);
      });

      // Switching back to L restores the original output (setting is applied both ways).
      cy.contains('.ant-radio-wrapper, .ant-radio-button-wrapper', '7%').click();
      getQrPathData().should('equal', low);
    });
  });

  it('changes output when inverting background color', () => {
    openCodeGenerator();
    typeValue('.ant-modal-content textarea', 'invert-me');

    getQrPathData().then((normal) => {
      cy.contains('.ant-checkbox-wrapper', 'Invert background color').click();
      // Inverting swaps fg/bg, producing different path geometry in the preview.
      getQrPathData().should('not.equal', normal);

      // Toggling back restores the original output.
      cy.contains('.ant-checkbox-wrapper', 'Invert background color').click();
      getQrPathData().should('equal', normal);
    });
  });

  it('generates a barcode onto the canvas', () => {
    openCodeGenerator();

    // Switch the dialog to Barcode mode via the title radio group.
    cy.contains('.ant-radio-button-wrapper', 'Barcode').click();

    // In barcode mode the only text <input> is the value field (QR uses a textarea).
    typeValue('.ant-modal-content input.ant-input', '123456');

    // JsBarcode renders <rect> bars into #barcode (non-empty output).
    cy.get('#barcode rect', { timeout: 15000 }).should('have.length.greaterThan', 1);

    cy.contains('.ant-modal-footer button', 'Confirm').should('not.be.disabled').click();

    cy.get('.ant-modal-content').should('not.exist');
    cy.waitForProgress();
    assertCodeOnCanvas();
  });
});
