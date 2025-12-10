it('offset', () => {
  cy.landingEditor();
  cy.wait(300);
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.clickToolBtn('Line');
  cy.get('svg#svgcontent').trigger('mousedown', 0, -50, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 230, 250, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.clickToolBtn('Cursor');
  cy.get('svg#svgcontent').trigger('mousedown', -10, -10, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.wait(500);
  cy.get('.tab.objects').click();
  cy.get('#offset').click();
  cy.findByTestId('offset-distance').clear().type('10').blur();
  cy.findAllByText('Confirm').click();

  cy.inputValueCloseTo('#w_size', 166.43, 0.1);
  cy.inputValueCloseTo('#h_size', 179.17, 0.1);
});
