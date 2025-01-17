describe('verify undo/redo behaviors', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('image', () => {
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#svg_1').should('exist');
    checkBehaviors();
  });

  it('geometry', () => {
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 150, 150, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 350, 350, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    checkBehaviors();
  });

  it('path', () => {
    cy.clickToolBtn('Line');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    checkBehaviors();
  });

  function checkBehaviors() {
    cy.wait(500);
    cy.get('div[title="Undo"]').click();
    cy.get('#svg_1').should('not.exist');
    cy.get('div[title="Redo"]').click();
    cy.get('#svg_1').should('exist');
  };
});
