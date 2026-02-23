const topbarModulesPrefix = '_-_-packages-core-src-web-app-components-beambox-TopBar-';

describe('check the existence of the top bar tools on mobile', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
    cy.getTopBar().should('exist');
  });

  it('menu', () => {
    cy.get(`[class*="${topbarModulesPrefix}TopBar-module__menu`).should('exist');
    cy.get('[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__item').contains('File').should('exist');
    cy.get('.szh-menu__item').contains('Edit').should('exist');
    cy.get('.szh-menu__item').contains('View').should('exist');
    cy.get('.szh-menu__item').contains('Machines').should('exist');
    cy.get('.szh-menu__item').contains('Account').should('exist');
    cy.get('.szh-menu__item').contains('Help').should('exist');
  });

  it('welcome page button', () => {
    cy.get(`[class*="${topbarModulesPrefix}WelcomePageButton-module__button"]`).should('exist').click();
    cy.location('hash').should('eq', '#/studio/welcome');
  });

  it('camera preview', () => {
    cy.getTopBar('[title="Preview"]').should('not.exist');
  });

  it('common tools', () => {
    cy.get(`[class*="${topbarModulesPrefix}CommonTools-module__common-tools-container"]`).should('exist');
    cy.getTopBar('[title="Delete"]').should('not.exist');
    cy.getTopBar('[title="Undo"]').should('exist');
    cy.getTopBar('[title="Redo"]').should('exist');
  });

  it('buttons on right', () => {
    cy.get(`[class*="${topbarModulesPrefix}TopBar-module__right"]`).should('exist');
    cy.get(`[class*="${topbarModulesPrefix}SelectMachineButton-module__button"]`).should('exist');
    cy.getTopBar('[title="Document Settings"]').should('exist');
    cy.getTopBar('[title="Running Frame"]').should('exist');
    cy.getTopBar('[title="Start Work"]').should('exist');
  });

  it('file name', () => {
    cy.get(`[class*="${topbarModulesPrefix}FileName-index-module__file-name"]`)
      .should('exist')
      .should('have.text', 'Untitled');
    cy.get('.adm-tab-bar-item-title').contains('Text').should('exist').click();
    cy.get(`[class*="${topbarModulesPrefix}FileName-index-module__file-name"]`).should('have.text', 'Untitled*');
  });
});
