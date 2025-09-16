it('check the existence of the tab bar tool on mobile', () => {
  cy.viewport('iphone-xr');
  cy.landingEditor();
  cy.get('.adm-tab-bar-item').contains('Camera').should('exist');
  cy.get('.adm-tab-bar-item').contains('Image').should('exist');
  cy.get('.adm-tab-bar-item').contains('Element').should('exist');
  cy.get('.adm-tab-bar-item').contains('Text').should('exist');
  cy.get('.adm-tab-bar-item').contains('Layer').should('exist');
  cy.get('.adm-tab-bar-item').contains('Pen').should('exist');
  cy.get('.adm-tab-bar-item').contains('Document').should('exist');
  cy.get('.adm-tab-bar-item').contains('Undo').should('exist');
  cy.get('.adm-tab-bar-item').contains('Redo').should('exist');
});
