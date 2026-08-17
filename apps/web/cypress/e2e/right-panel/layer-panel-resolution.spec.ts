describe('Set layer resolution config', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('resolution', () => {
    // DPI is a Select (DpiBlock.tsx); the option label is `${value} DPI`,
    // while the layer <g> stores the option name (data-dpi="low" | "medium" | ...).
    cy.get('#dpi-select').closest('.ant-select').click();
    cy.get('.ant-select-item-option-content').contains('500 DPI').click();
    cy.get('#dpi-select').closest('.ant-select').find('.ant-select-selection-item').should('have.text', '500 DPI');
    cy.get('g.layer').should('have.attr', 'data-dpi', 'high');

    cy.get('#dpi-select').closest('.ant-select').click();
    cy.get('.ant-select-item-option-content').contains('1000 DPI').click();
    cy.get('#dpi-select').closest('.ant-select').find('.ant-select-selection-item').should('have.text', '1000 DPI');
    cy.get('g.layer').should('have.attr', 'data-dpi', 'detailed');

    cy.get('#dpi-select').closest('.ant-select').click();
    cy.get('.ant-select-item-option-content').contains('125 DPI').click();
    cy.get('#dpi-select').closest('.ant-select').find('.ant-select-selection-item').should('have.text', '125 DPI');
    cy.get('g.layer').should('have.attr', 'data-dpi', 'low');
  });
});
