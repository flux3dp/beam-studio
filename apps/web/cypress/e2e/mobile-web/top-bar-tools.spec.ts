const topbarModulesPrefix = 'src-web-app-components-beambox-top-bar-';

describe('check the existence of the top bar tools on mobile', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
    cy.get('.top-bar').should('exist');
  });

  it('menu', () => {
    cy.get('.top-bar .top-bar-menu-container').should('exist');
    cy.get('.menu-btn-container').click();
    cy.get('.rc-menu__item').contains('File').should('exist');
    cy.get('.rc-menu__item').contains('Edit').should('exist');
    cy.get('.rc-menu__item').contains('View').should('exist');
    cy.get('.rc-menu__item').contains('Machines').should('exist');
    cy.get('.rc-menu__item').contains('Account').should('exist');
    cy.get('.rc-menu__item').contains('Help').should('exist');
  });

  it('user avatar', () => {
    cy.get(`.top-bar [class*="${topbarModulesPrefix}UserAvatar-module__user-avatar"]`)
      .should('exist')
      .click();
    cy.get('.ant-modal-content').contains('Sign In').should('exist');
  });

  it('camera preview', () => {
    cy.get('.top-bar [title="Preview"]').should('not.exist');
  });

  it('common tools', () => {
    cy.get(
      `.top-bar [class*="${topbarModulesPrefix}CommonTools-module__common-tools-container"]`
    ).should('exist');
    cy.get('.top-bar [title="Delete"]').should('not.exist');
    cy.get('.top-bar [title="Undo"]').should('exist');
    cy.get('.top-bar [title="Redo"]').should('exist');
  });

  it('buttons on right', () => {
    cy.get(`.top-bar [class*="${topbarModulesPrefix}TopBar-module__right"]`).should('exist');
    cy.get(`.top-bar [class*="${topbarModulesPrefix}SelectMachineButton-module__button"]`).should(
      'exist'
    );
    cy.get('.top-bar [title="Running Frame"]').should('exist');
    cy.get('.top-bar [title="Start Work"]').should('exist');
  });

  it('file name', () => {
    cy.get(`.top-bar [class*="${topbarModulesPrefix}FileName-module__file-name"]`)
      .should('exist')
      .should('have.text', 'Untitled');
    cy.get('.adm-tab-bar-item-title').contains('Text').should('exist').click();
    cy.get(`.top-bar [class*="${topbarModulesPrefix}FileName-module__file-name"]`).should(
      'have.text',
      'Untitled*'
    );
  });
});
