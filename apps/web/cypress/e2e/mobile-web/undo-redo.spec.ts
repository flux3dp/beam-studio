describe('mobile undo redo', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
  });

  it('undo and redo by canvas bar', () => {
    cy.get('.adm-tab-bar-item-title').contains('Text').should('exist').click();
    cy.get('#svg_1').should('exist');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.get('.adm-tab-bar-item-title').contains('Undo').should('exist').click({ force: true });
    cy.get('#svg_1').should('not.exist');
    cy.getElementTitle().should('not.exist');
    cy.get('.adm-tab-bar-item-title').contains('Redo').should('exist').click({ force: true });
    cy.get('#svg_1').should('exist').click();
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
  });

  it('undo and redo by top bar', () => {
    cy.get('.adm-tab-bar-item-title').contains('Text').should('exist').click();
    cy.get('#svg_1').should('exist');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.getTopBar('[title="Undo"]').should('exist').click();
    cy.get('#svg_1').should('not.exist');
    cy.getElementTitle().should('not.exist');
    cy.getTopBar('[title="Redo"]').should('exist').click();
    cy.get('#svg_1').should('exist').click();
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
  });
});
