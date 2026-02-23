describe('verify top bar behaviors under device disconnection', () => {
  const isRunningAtGithub = Cypress.env('envType') === 'github';
  beforeEach(() => {
    cy.landingEditor();
  });

  it('show #801 while clicking on preview button', () => {
    cy.clickToolBtn('Preview', false);
    cy.get('.ant-modal-content').contains('#801').should('exist');
  });

  it('show #801 while clicking on select machine button', () => {
    cy.findByTestId('select-machine').should('exist');
    cy.findByTestId('select-machine').click();
    cy.get('.ant-modal-content').contains('#801').should('exist');
  });

  it('show #801 while clicking on framing button', () => {
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 150, 150, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 350, 350, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');

    cy.getTopBar('[title="Running Frame"]').should('exist');
    cy.getTopBar('[title="Running Frame"]').click();
    cy.get('.ant-modal-content').contains('#801').should('exist');
  });

  if (!isRunningAtGithub) {
    // github does not support webgl
    it('path preview button is disabled', () => {
      cy.getTopBar('[title="Path preview"]').should('exist');
      cy.getTopBar('[title="Path preview"]').invoke('attr', 'class').should('contain', 'disabled');
      cy.getTopBar('[title="Path preview"]').should('have.css', 'pointer-events', 'none');
    });
  }

  it('GO button is disabled', () => {
    cy.getTopBar('[title="Start Work"]').should('exist');
    cy.getTopBar('[title="Start Work"]').invoke('attr', 'class').should('contain', 'disabled');
    cy.getTopBar('[title="Start Work"]').should('have.css', 'pointer-events', 'none');
  });

  it('toturial is unable to start', () => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.contains('Help').click();
    cy.contains('Show Start Tutorial').click();
    cy.contains('Searching machine for tutorial...').should('exist');
    cy.contains('Searching machine for tutorial...').should('not.exist');
    cy.get('.ant-modal-content').should(
      'have.text',
      'Unable to find machine for Tutorial. Do you want to go to connection setting page, retry or skip tutorial?Set ConnectionRetrySkip',
    );
  });
});
