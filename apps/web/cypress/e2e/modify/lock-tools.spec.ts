it('lock', () => {
  cy.landingEditor();
  cy.clickToolBtn('Polygon');
  cy.get('svg#svgcontent').trigger('mousedown', 10, 10, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 50, 50, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('#svg_1').should('exist');
  cy.get('.tab.objects').click();
  cy.get('button#lock').should('have.attr', 'title', 'Lock Aspect');
  cy.get('button#lock').click();
  cy.get('#w_size').type('{selectall}{backspace}100').blur();
  cy.inputValueCloseTo('#h_size', 100, 1);

  cy.get('#h_size').type('{selectall}{backspace}150').blur();
  cy.inputValueCloseTo('#h_size', 150, 1);
});
