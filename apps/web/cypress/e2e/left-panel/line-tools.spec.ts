it('draw line lock rotate by shift', () => {
  cy.landingEditor();
  cy.clickToolBtn('Line');
  cy.get('svg#svgcontent')
    .trigger('mousedown', { which: 1, pageX: 100, pageY: 100, force: true })
    .trigger('mousemove', { which: 1, pageX: 200, pageY: 200, shiftKey: true, force: true })
    .trigger('mouseup', { force: true });
  cy.showPanel('objects');
  cy.get('#rotate').should('have.attr', 'value').and('eq', '0');
});
