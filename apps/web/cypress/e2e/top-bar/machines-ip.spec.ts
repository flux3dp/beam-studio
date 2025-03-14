const isRunningAtGithub = Cypress.env('envType') === 'github';
const beamSeriesName = Cypress.env('beamSeriesName');

describe('test machine connection', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });
    return;
  }

  beforeEach(() => {
    cy.setUpBackend(Cypress.env('backendIP'));
    cy.landingEditor();
  });

  it('select connect Beam Seriers machine', () => {
    cy.connectMachine(beamSeriesName);
    cy.get('.top-bar-menu-container').should('exist').click();
    cy.contains('.rc-menu__item', 'Machines').click();
    cy.contains('.rc-menu__item', 'Ador (Cruz)').click();
    cy.contains('.rc-menu__item', 'Machine Info').click();
    cy.contains('192.168.1.177').should('exist');
    cy.get('.ant-btn').contains('OK').click();
    cy.get('[data-testid="select-machine"]').click();
    cy.get('label').contains('Ador (Cruz)').click();
    cy.get('.ant-btn').contains('Yes').click();
  });
});
