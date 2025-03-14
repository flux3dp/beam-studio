describe('test machine connection', () => {
  const isRunningAtGithub = Cypress.env('envType') === 'github';
  const beamSeriesName = Cypress.env('beamSeriesName');
  const adorName = Cypress.env('adorName');

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
  });

  it('select connect Ador machine', () => {
    cy.connectMachine(adorName);
  });
});
