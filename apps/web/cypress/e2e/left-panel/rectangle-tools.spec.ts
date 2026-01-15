describe('rectangle tools', () => {
  beforeEach(() => {
    cy.landingEditor();
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('.tab.objects').click();
  });

  it('rounded corner', () => {
    cy.get('div.option-input > input').dblclick({ force: true });
    cy.get('div.option-input > input').clear({ force: true }).type('40', { force: true }).blur();
    cy.get('#svg_1').should('have.attr', 'rx').and('eq', '400');
  });

  it('infill', () => {
    cy.get('#svg_1').should('have.attr', 'fill', 'none');
    cy.get('#infill').click();
    cy.get('#svg_1').should('have.attr', 'fill', '#333333');
  });
});
