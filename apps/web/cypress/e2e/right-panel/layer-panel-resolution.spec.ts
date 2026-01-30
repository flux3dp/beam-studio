describe('Set layer resolution config', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('resolution', () => {
    cy.get('#dpi div.ant-slider-handle').as('handle');
    cy.get('@handle').trigger('mousedown');
    cy.get('@handle').trigger('mousemove', 50, 0, { force: true });
    cy.get('@handle').trigger('mouseup');
    cy.findByText('Resolution: 500 DPI').should('exist');
    cy.get('@handle').trigger('mousedown');
    cy.get('@handle').trigger('mousemove', 50, 0, { force: true });
    cy.get('@handle').trigger('mouseup');
    cy.findByText('Resolution: 1000 DPI').should('exist');
    cy.get('@handle').trigger('mousedown');
    cy.get('@handle').trigger('mousemove', -200, 0, { force: true });
    cy.get('@handle').trigger('mouseup');
    cy.findByText('Resolution: 125 DPI').should('exist');
  });
});
