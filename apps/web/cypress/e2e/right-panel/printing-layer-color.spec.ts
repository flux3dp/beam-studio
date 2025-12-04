const colorPickerPrefix = '_-_-packages-core-src-web-app-widgets-ColorPicker-module__';

const changeAndCheckColor = (hex: string, rgb: string) => {
  cy.get(`.layer-item div[class*="${colorPickerPrefix}color"]`).click({ force: true });
  cy.get(`[style="background-color: ${rgb};"]`).click();
  cy.get('.ant-btn').contains('OK').click();
  cy.get(`div[class*="${colorPickerPrefix}color"]`).should('have.attr', 'style', `background: ${rgb};`);
  cy.get('g.layer').should('have.attr', 'data-color', hex);
};

describe('printing layer color', () => {
  beforeEach(() => {
    cy.landingEditor();
    cy.changeWorkarea('Ador');
    cy.get('.ant-select-selection-item').contains('20W Diode Laser').click();
    cy.get('.ant-select-item-option-content').contains('Printing').click();
    cy.get('.ant-btn').contains('Confirm').click();
    cy.get('#presprayAreaImage').should('be.visible');
  });

  it('change color', () => {
    cy.clickToolBtn('Element', false);
    cy.get('.anticon[id="basic/icon-circle"]').click();
    cy.get('.ant-drawer-header').should('not.exist');
    cy.get('#svg_1').should('be.visible').click();
    cy.get('.tab.objects').click();
    cy.get(`div[class*="${colorPickerPrefix}color"]`)
      .eq(0)
      .should('have.css', 'background-color', 'rgb(91, 91, 91)')
      .click();
    cy.get(`div[class*="${colorPickerPrefix}inner"][style="background-color: rgb(114, 46, 209);"]`).click();
    cy.get('.ant-btn').contains('OK').click();
    cy.get('#svg_1').should('have.attr', 'fill', '#722ED1');
  });

  const isRunningAtGithub = Cypress.env('envType') === 'github';
  if (!isRunningAtGithub) {
    it('expand layer and change color', () => {
      cy.clickToolBtn('Element', false);
      cy.get('.anticon[id="basic/icon-circle"]').click();
      cy.get('.ant-drawer-header').should('not.exist');
      cy.get('#svg_1').should('be.visible').click();
      cy.get('.tab.objects').click();
      cy.get(`div[class*="${colorPickerPrefix}color"]`)
        .eq(0)
        .should('have.css', 'background-color', 'rgb(91, 91, 91)')
        .click();
      cy.get(`div[class*="${colorPickerPrefix}inner"][style="background-color: rgb(139, 187, 17);"]`).click();
      cy.get('.ant-btn').contains('OK').click();
      cy.get('.tab.layers').click();
      cy.get('#layerdoubleclick-0').rightclick();
      cy.get('.react-contextmenu-item').contains('Expand Layer').click();
      cy.get('.ant-btn').contains('Confirm').click();
      cy.contains('Splitting Full Color Layer').should('exist', { timeout: 10000 });
      cy.contains('Splitting Full Color Layer').should('not.exist', { timeout: 10000 });
      cy.findByTestId('Layer 1 (K)').should('exist');
      cy.get('#svg_2').should('be.visible').should('have.attr', 'filter', 'url(#filter#1D1D1B)');
      cy.get('#layerdoubleclick-3').rightclick();
      cy.get('.react-contextmenu-item').contains('Delete Layer').click();
      cy.findByTestId('Layer 1 (C)').should('exist');
      cy.get('#svg_3').should('be.visible').should('have.attr', 'filter', 'url(#filter#009FE3)');
      cy.get('#layerdoubleclick-2').rightclick();
      cy.get('.react-contextmenu-item').contains('Delete Layer').click();
      cy.findByTestId('Layer 1 (M)').should('exist');
      cy.get('#svg_4').should('be.visible').should('have.attr', 'filter', 'url(#filter#E6007E)');
      cy.get('#layerdoubleclick-1').rightclick();
      cy.get('.react-contextmenu-item').contains('Merge Down').click();
      cy.findByTestId('Layer 1 (Y)').should('exist');
      cy.get('#svg_4').should('be.visible').should('have.attr', 'filter', 'url(#filter#FFED00)');

      changeAndCheckColor('#1D1D1B', 'rgb(29, 29, 27)');
      changeAndCheckColor('#FFED00', 'rgb(255, 237, 0)');
      changeAndCheckColor('#E6007E', 'rgb(230, 0, 126)');
      changeAndCheckColor('#009FE3', 'rgb(0, 159, 227)');

      cy.get('#presprayAreaImage').should('be.visible');
      cy.clickToolBtn('Element', false);
      cy.get('.anticon[id="basic/icon-circle"]').click();
      cy.get('#svg_6').should('be.visible').should('have.attr', 'fill', '#009FE3');
    });
  }

  it('single color layer and change color', () => {
    cy.get('.tab.layers').click();
    cy.get('#layerdoubleclick-0').rightclick();
    cy.get('.react-contextmenu-item').contains('Switch to single color layer').click();
    cy.get(`div[class*="${colorPickerPrefix}color"]`).should('have.attr', 'style', 'background: rgb(0, 159, 227);');
    cy.get('g.layer').should('have.attr', 'data-color', '#009FE3');

    changeAndCheckColor('#1D1D1B', 'rgb(29, 29, 27)');
    changeAndCheckColor('#FFED00', 'rgb(255, 237, 0)');
    changeAndCheckColor('#E6007E', 'rgb(230, 0, 126)');
    changeAndCheckColor('#009FE3', 'rgb(0, 159, 227)');
  });
});
