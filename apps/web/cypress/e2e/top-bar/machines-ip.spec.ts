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
    cy.getMenuItem(['Machines', 'Ador (Cruz)'], 'Machine Info').click();
    cy.contains('192.168.1.177').should('exist');
    cy.get('.ant-btn').contains('OK').click();
    cy.get('[data-testid="select-machine"]').click();
    cy.get('label').contains('Ador (Cruz)').click();
    cy.get('.ant-btn').contains('Yes').click();
  });
});
