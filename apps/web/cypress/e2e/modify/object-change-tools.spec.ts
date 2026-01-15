describe('object change tools', () => {
  beforeEach(() => {
    cy.landingEditor();
    cy.clickToolBtn('Polygon');
    cy.get('svg#svgcontent').trigger('mousedown', 50, 50, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    cy.get('.tab.objects').click();
  });

  it('change object location by hand movement', () => {
    cy.get('#x_position').type('{selectall}{backspace}100').blur();
    cy.get('#y_position').type('{selectall}{backspace}100').blur();

    cy.inputValueCloseTo('#x_position', 100, 0.01);
    cy.inputValueCloseTo('#y_position', 100, 0.01);
  });

  it('change object rotate by hand movement', () => {
    cy.get('#rotate').type('{selectall}{backspace}135').blur();
    cy.inputValueCloseTo('#rotate', 135, 0.01);
  });

  it('change object size by hand movement', () => {
    cy.get('#w_size').type('{selectall}{backspace}150').blur();
    cy.get('#h_size').type('{selectall}{backspace}150').blur();
    cy.inputValueCloseTo('#w_size', 150, 0.01);
    cy.inputValueCloseTo('#h_size', 150, 0.01);
  });
});
