describe('verify shortcuts', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('jump to the preference page', () => {
    const cmdKey = Cypress.platform === 'darwin' ? 'command' : 'ctrl';
    cy.get('body').type(`{${cmdKey}+k}`);
    cy.url().should('contain', '#/studio/settings');
  });

  it('jump to the connection type selection page', () => {
    cy.get('body').type('{option+M}');
    cy.url().should('contain', '#/initialize/connect/select-machine-model');
  });
});
