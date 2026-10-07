it('check new file', () => {
  cy.landingEditor();
  cy.clickToolBtn('Pen');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 300, 320, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 220, 50, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 40, 400, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 100, 150, { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 0, 0, { force: true });
  cy.get('#svg_1').should('exist');
  cy.getMenuItem(['File'], 'New').click();
  cy.contains('button span', "Don't Save").click();
  cy.get('#svg_1').should('not.exist');
});

it('check new file after reset', () => {
  const isRunningAtGithub = Cypress.env('envType') === 'github';

  cy.landingEditor();
  cy.go2Preference();
  cy.get('.ant-modal-footer button').contains('Reset Beam Studio').click();
  cy.contains('Next').click();
  cy.contains('Sign in later').click();
  cy.contains('Skip').click();
  cy.contains('New Project').click();
  // Sentry, then (with a machine) camera calibration and the tutorial prompt, then the FLUX 101 nudge
  cy.get('button[class^="ant-btn"]').contains('No').click({ timeout: 100000 });

  for (let i = 1; i < (isRunningAtGithub ? 1 : 3); i++) {
    cy.get('button[class^="ant-btn"]').contains('No').click();
  }

  cy.get('button[class^="ant-btn"]').contains('Maybe later').click();
  cy.clickToolBtn('Pen');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 300, 320, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 220, 50, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 40, 400, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 100, 150, { force: true });
  cy.get('svg#svgcontent').trigger('mousedown', 0, 0, { force: true });
  cy.get('#svg_1').should('exist');
  cy.getMenuItem(['File'], 'New').click();
  cy.contains('button span', "Don't Save").click();
  cy.get('#svg_1').should('not.exist');
});
