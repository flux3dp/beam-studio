describe('manipulate document setting (resolution)', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  const openDocument = () => {
    cy.get('div.menu-btn-container').click();
    cy.get('.rc-menu--open > :nth-child(2) > :nth-child(1)').click();
    cy.contains('Document Settings').click();
  };

  it('resolution', () => {
    openDocument();
    // Wait for document settings modal to open
    cy.get('#dpi').should('exist');
    cy.get('#dpi').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Medium (250 DPI)');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains('Low (125 DPI)').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Low (125 DPI)');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('@select').should('have.class', 'ant-select-open');
    cy.get('.ant-select-item-option-content').contains('Detailed (1000 DPI)').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Detailed (1000 DPI)');
  });
});
