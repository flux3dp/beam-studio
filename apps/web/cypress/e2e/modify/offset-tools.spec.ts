it('offset', () => {
  cy.landingEditor();
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
  // Wait for selection to be recognized
  cy.findAllByText('Multiple Objects').should('exist');
  cy.get('.tab.objects').click();
  cy.get('#offset').click();
  // Wait for modal and initial preview to be ready
  cy.findByTestId('offset-distance').should('be.visible').and('not.be.disabled');
  // Use force:true to bypass any overlay issues during preview generation
  cy.findByTestId('offset-distance').clear({ force: true }).type('10', { force: true }).blur();
  cy.findAllByText('Confirm').click();
  // Wait for modal to close
  cy.findByTestId('offset-distance').should('not.exist');

  cy.inputValueCloseTo('#w_size', 166.43, 0.1);
  cy.inputValueCloseTo('#h_size', 179.17, 0.1);
});
