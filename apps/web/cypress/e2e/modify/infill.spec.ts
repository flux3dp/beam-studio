it('infill', () => {
  cy.landingEditor();
  cy.clickToolBtn('Element', false);
  cy.get('.ant-drawer-header').contains('Element').should('exist');
  cy.get('.anticon[id="basic/icon-circle"]').click();
  cy.get('.ant-drawer-header').should('not.exist');
  cy.get('#svg_1').should('exist');
  cy.get('#svg_1').should('have.attr', 'cx', '250');
  cy.get('#svg_1').should('have.attr', 'cy', '250');
  cy.get('#svg_1').should('have.attr', 'fill', '#333333');
  cy.get('#svg_1').click();
  cy.get('.tab.objects').click();
  cy.get('#infill').click();
  cy.get('#svg_1').should('have.attr', 'fill', 'none');
});
