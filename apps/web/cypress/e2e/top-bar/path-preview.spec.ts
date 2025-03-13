import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const beamSeriesName = Cypress.env('beamSeriesName');

describe('path preview', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });
    return;
  }

  it('path preview with beamseries', () => {
    cy.setUpBackend(Cypress.env('backendIP'));
    cy.landingEditor();
    cy.connectMachine(beamSeriesName);
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#w_size').clear().type('20{enter}');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    cy.get('.ant-space-item').contains('Layer').click();
    cy.contains('.ant-modal-content', 'Select layering style:').contains('OK').click();
    cy.get('#svg_3', { timeout: 50000 }).should('exist');

    cy.get('[title="Path preview"]').click();
    cy.get('.tools-panel').should('exist');
    cy.get('#path-preview-side-panel').should('exist');
    cy.get('#path-preview-side-panel', { timeout: 30000 }).should('not.contain', 'NaN');
    cy.get('[title="Undo"]').should('not.exist');
    cy.get('[title="Redo"]').should('not.exist');
    cy.get('[title="Delet"]').should('not.exist');

    cy.get('.btn').contains('End Preview').click();
    cy.get('[title="Undo"]', { timeout: 5000 }).should('exist');
    cy.get('[title="Redo"]').should('exist');
    cy.get('[title="Delete"]').should('exist');

    cy.get('#svg_1').should('exist').should('have.attr', 'width', '200').should('have.attr', 'height', '140');
    cy.get('symbol#svg_2>g>g')
      .invoke('prop', 'innerHTML')
      .then((html) => {
        expect(md5(html)).equal('5fa966ee7b8d7e29490ff2244f67047a');
      });
  });
});
