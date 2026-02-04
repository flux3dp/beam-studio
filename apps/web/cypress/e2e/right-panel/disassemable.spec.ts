import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const beamSeriesName = Cypress.env('beamSeriesName');

describe('disassemable', () => {
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

  it('disassemable', () => {
    cy.connectMachine(beamSeriesName);
    cy.uploadFile('svg.svg', 'image/svg+xml');
    cy.get('div[class*="src-web-app-components-dialogs-AlertAndProgress-module__nonstop--"').should('exist');
    cy.contains('.ant-modal-content', 'Select layering style:').as('modal');
    cy.get('@modal').contains('Layer').click();
    cy.get('@modal').contains('OK').click();
    cy.get('div[class*="src-web-app-components-dialogs-AlertAndProgress-module__nonstop--"', {
      timeout: 10000,
    }).should('not.exist');
    cy.get('#svg_2').should('exist');
    cy.getElementTitle().contains('Layer 1 > SVG Object').should('exist');
    cy.get('[class*="src-web-app-components-beambox-RightPanel-LayerPanel-LayerList-module__row--"]').should(
      'have.attr',
      'data-layer',
      'Layer 1',
    );
    cy.get('#disassemble_use').click();
    cy.get('.ant-btn').contains('Yes').click();
    cy.get('#svg_14').should('have.attr', 'fill', '#333333');
    cy.get('#svg_14')
      .invoke('attr', 'd')
      .then((html) => expect(md5(html)).equal('b51e560dbd93ab3f0fdfab4a851b5078'));
    cy.get('#svg_15').should('have.attr', 'fill', 'none');
    cy.get('#svg_15')
      .invoke('attr', 'd')
      .then((html) => expect(md5(html)).equal('b51e560dbd93ab3f0fdfab4a851b5078'));
    cy.get('#svg_16').should('have.attr', 'fill', '#333333');
    cy.get('#svg_16')
      .invoke('attr', 'd')
      .then((html) => expect(md5(html)).equal('094096ea7e20e5ee4c5bfbad81767310'));
    cy.get('#svg_17').should('have.attr', 'fill', 'none');
    cy.get('#svg_17')
      .invoke('attr', 'd')
      .then((html) => expect(md5(html)).equal('094096ea7e20e5ee4c5bfbad81767310'));
  });
});
