it('snap to vertices', () => {
  cy.landingEditor();
  cy.clickToolBtn('Pen');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 150, 150, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 147, 10, { force: true });
  cy.get('#align_line_x_0').should('exist');
  cy.get('svg#svgcontent').trigger('mousedown', 147, 10, { force: true });
  cy.get('#drawingPoint_2').should(($value) => {
    expect($value.attr('cx')).to.be.closeTo(250, 1);
  });
});
