describe('mobile undo redo', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
  });

  it('undo and redo by canvas bar', () => {
    cy.get('.adm-tab-bar-item-title').contains('Text').should('exist').click();
    cy.get('#svg_1').should('exist');
    cy.get('div.top-bar div.element-title').should('have.text', 'Layer 1 > Text');
    cy.get('.adm-tab-bar-item-title').contains('Undo').should('exist').click({ force: true });
    cy.get('#svg_1').should('not.exist');
    cy.get('div.top-bar div.element-title').should('not.exist');
    cy.get('.adm-tab-bar-item-title').contains('Redo').should('exist').click({ force: true });
    cy.get('#svg_1').should('exist').click();
    cy.get('div.top-bar div.element-title').should('have.text', 'Layer 1 > Text');
  });

  it('undo and redo by top bar', () => {
    cy.get('.adm-tab-bar-item-title').contains('Text').should('exist').click();
    cy.get('#svg_1').should('exist');
    cy.get('div.top-bar div.element-title').should('have.text', 'Layer 1 > Text');
    cy.get('.top-bar [title="Undo"]').should('exist').click();
    cy.get('#svg_1').should('not.exist');
    cy.get('div.top-bar div.element-title').should('not.exist');
    cy.get('.top-bar [title="Redo"]').should('exist').click();
    cy.get('#svg_1').should('exist').click();
    cy.get('div.top-bar div.element-title').should('have.text', 'Layer 1 > Text');
  });
});
