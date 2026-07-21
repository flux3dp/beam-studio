// Release-test coverage:
// - Rows 290-294: switching workarea across models updates the canvas workarea (#svgcontent viewBox).
// - Rows 181-184: switching the Ador laser module keeps the canvas workarea at the Ador max size.
// - Row 257: changing workarea while content exists shows the layer-conversion warning popup.
//
// The canvas workarea size comes from workarea-constants.ts: viewBox is `0 0 (width*10) (pxDisplayHeight ?? pxHeight)`.
// For Ador width=430 and pxDisplayHeight=3200 (displayHeight 320mm), so the Ador canvas stays 4300x3200 for
// every laser module. The per-module physical cutting max height (270/290/300/282mm) is drawn as a separate
// #boundary-path overlay and, with the default `use-union-boundary` preference on, is not a deterministic
// per-module value, so it is not asserted here.

const moduleBlockPrefix =
  '_-_-packages-core-src-web-app-components-beambox-RightPanel-ConfigPanel-ModuleBlock-module__';

describe('manipulate workarea and modules', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  // Rows 290-294: canvas workarea per model, dimensions from workarea-constants.ts
  const workareaCases: Array<{ name: string; viewBox: string }> = [
    { name: 'beamo', viewBox: '0 0 3000 2100' }, // fbm1: 300 x 210
    { name: 'Beambox', viewBox: '0 0 4000 3750' }, // fbb1b: 400 x 375
    { name: 'HEXA', viewBox: '0 0 7400 4100' }, // fhexa1: 740 x 410
    { name: 'Beambox II', viewBox: '0 0 6000 3750' }, // fbb2: 600 x 375
    { name: 'Ador', viewBox: '0 0 4300 3200' }, // ado1: 430 x 320 (displayHeight)
  ];

  workareaCases.forEach(({ name, viewBox }) => {
    it(`working area of ${name}`, () => {
      cy.changeWorkarea(name);
      cy.get('#svgcontent').should('have.attr', 'viewBox', viewBox);
    });
  });

  // Rows 181-184: switching the Ador laser module keeps the Ador canvas workarea (4300 x 3200).
  const selectModule = (name: string) => {
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).click();
    cy.get('.ant-select-item-option-content').contains(name).click();
    cy.get('body').then(($body) => {
      // Switching to/from the printing module asks to convert layers; confirm if prompted.
      if ($body.find('.ant-modal-content').length) {
        cy.get('button.ant-btn').contains('Confirm').click({ force: true });
      }
    });
  };

  const adorModules = ['10W Diode Laser', '20W Diode Laser', 'Printing', '2W Infrared Laser'];

  adorModules.forEach((moduleName) => {
    it(`Ador canvas workarea stays 4300x3200 for ${moduleName} module`, () => {
      cy.changeWorkarea('Ador');
      cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');

      selectModule(moduleName);

      // Module selector reflects the chosen module, and the canvas workarea is unchanged.
      cy.get(`div[class*="${moduleBlockPrefix}select"] .ant-select-selection-item`).should(
        'have.text',
        moduleName,
      );
      cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');
    });
  });

  // Row 257: changing workarea while content exists shows the layer-conversion warning popup.
  it('warns before converting layers when changing workarea with content', () => {
    cy.changeWorkarea('Ador');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');

    // Switch to the printing module so drawn content lives on a printing layer.
    selectModule('Printing');

    // Draw a rectangle so the document has content.
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');

    // Changing to a laser-only machine pops the conversion warning.
    cy.changeWorkarea('beamo');
    cy.get('.ant-modal-content').should('exist');
    cy.get('[class*="src-web-app-components-dialogs-Alert-module__message-container"]').should(
      'have.text',
      'Do you want to convert the Printing Layers into Laser Layers?',
    );

    // Confirm the conversion and verify the workarea actually switched to beamo.
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 3000 2100');
  });
});
