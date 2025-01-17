describe('verify top bar behaviors under device disconnection', () => {
  const isRunningAtGithub = Cypress.env('envType') === 'github';
  beforeEach(() => {
    cy.landingEditor();
  });

  it('show #801 while clicking on preview button', () => {
    cy.get('.top-bar [title="Preview"]').should('exist');
    cy.get('.top-bar [title="Preview"]').click();
    cy.get('.ant-modal-content').contains('#801').should('exist');
  });

  it('show #801 while clicking on select machine button', () => {
    cy.findByTestId('select-machine').should('exist');
    cy.findByTestId('select-machine').click();
    cy.get('.ant-modal-content').contains('#801').should('exist');
  });

  it('show #801 while clicking on framing button', () => {
    cy.get('.top-bar [title="Running Frame"]').should('exist');
    cy.get('.top-bar [title="Running Frame"]').click();
    cy.get('.ant-modal-content').contains('#801').should('exist');
  });

  if (!isRunningAtGithub) {
    // github does not support webgl
    it('path preview button is disabled', () => {
      cy.get('.top-bar [title="Path preview"]').should('exist');
      cy.get('.top-bar [title="Path preview"]').invoke('attr', 'class').should('contain', 'disabled');
      cy.get('.top-bar [title="Path preview"]').should('have.css', 'pointer-events', 'none');
    });
  }

  it('GO button is disabled', () => {
    cy.get('.top-bar [title="Start Work"]').should('exist');
    cy.get('.top-bar [title="Start Work"]').invoke('attr', 'class').should('contain', 'disabled');
    cy.get('.top-bar [title="Start Work"]').should('have.css', 'pointer-events', 'none');
  });

  it('toturial is unable to start', () => {
    cy.get('div.menu-btn-container').click();
    cy.contains('Help').click();
    cy.contains('Show Start Tutorial').click();
    cy.contains('Searching machine for tutorial...').should('exist');
    cy.contains('Searching machine for tutorial...').should('not.exist');
    cy.get('.ant-modal-content').should(
      'have.text',
      'Unable to find machine for Tutorial. Do you want to go to connection setting page, retry or skip tutorial?Set ConnectionRetrySkip'
    );
  });
});
