describe('verify shortcuts', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('open the settings modal', () => {
    const cmdKey = Cypress.platform === 'darwin' ? 'command' : 'ctrl';
    cy.get('body').type(`{${cmdKey}+k}`);
    cy.get('.ant-modal-title').should('have.text', 'Settings');
  });

  it('jump to the connection type selection page', () => {
    cy.get('body').type('{option+M}');
    cy.url().should('contain', '#/initialize/connect/select-machine-model');
  });
});
