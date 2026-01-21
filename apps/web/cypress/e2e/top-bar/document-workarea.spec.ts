describe('manipulate document setting (workarea)', () => {
  const moduleBlockPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-ConfigPanel-ModuleBlock-module__';

  beforeEach(() => {
    cy.landingEditor();
  });

  it('working area of beamo', () => {
    cy.changeWorkarea('beamo');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 3000 2100');
  });

  it('working area of beambox', () => {
    cy.changeWorkarea('Beambox');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4000 3750');
  });

  it('working area of beambox pro', () => {
    cy.changeWorkarea('Beambox Pro');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 6000 3750');
  });

  it('working area of HEXA', () => {
    cy.changeWorkarea('HEXA');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 7400 4100');
  });

  it('working area of Ador', () => {
    cy.changeWorkarea('Ador');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');
  });

  it('change Ador printing layer to Beamseries', () => {
    cy.changeWorkarea('Ador');
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');
    cy.get(`div[class*="${moduleBlockPrefix}select"] > .ant-select-selector`).click();
    cy.get('.ant-select-item-option-content').contains('Printing').click();
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4300 3200');
    cy.changeWorkarea('beamo');
    cy.get('.ant-modal-content').should('exist');
    cy.get('[class*="src-web-app-views-dialogs-Alert-module__message-container"]').should(
      'have.text',
      'Do you want to convert the Printing Layers into Laser Layers?',
    );
    cy.get('button.ant-btn').contains('Confirm').should('exist').click({ force: true });
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 3000 2100');
  });
});
