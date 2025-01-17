describe('polygen tools', () => {
  beforeEach(() => {
    cy.landingEditor();
    cy.clickToolBtn('Polygon');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 250, 250, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  });

  it('change sides by keyboard', () => {
    cy.get('#svg_1').trigger('keydown', { keyCode: 189, force: true });
    cy.get('#svg_1').trigger('keyup', { keyCode: 189, force: true });
    cy.get('.option-input > input').should('have.attr', 'value').and('eq', '4');
    cy.get('#svg_1').trigger('keydown', { keyCode: 187, force: true });
    cy.get('#svg_1').trigger('keyup', { keyCode: 187, force: true });
    cy.get('.option-input > input').should('have.attr', 'value').and('eq', '5');
  });

  it('lock rotate by shift', () => {
    cy.get('#svg_1').click({ force: true });
    cy.get('#selectorGrip_rotate')
      .trigger('mousedown', { which: 1, pageX: 100, pageY: 100, shiftKey: true })
      .trigger('mousemove', { which: 1, pageX: 200, pageY: 200, shiftKey: true })
      .trigger('mouseup');
    cy.get('#rotate').should('have.attr', 'value').and('eq', '-135');
  });
});
