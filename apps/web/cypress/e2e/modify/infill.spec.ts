it('infill', () => {
  cy.landingEditor();
  cy.clickToolBtn('Element');
  cy.get('[class="ant-modal-header"]').contains('Element').should('exist');
  cy.get('.anticon[class*="src-web-app-views-beambox-ShapePanel-ShapeIcon-module__icon"]')
    .eq(0)
    .click();
  cy.get('#svg_1').should('exist');
  cy.get('#svg_1').should('have.attr', 'cx', '250');
  cy.get('#svg_1').should('have.attr', 'cy', '250');
  cy.get('#svg_1').should('have.attr', 'fill', '#333333');
  cy.get('#svg_1').click();
  cy.get('.tab.objects').click();
  cy.get('#infill').click();
  cy.get('#svg_1').should('have.attr', 'fill', 'none');
});
