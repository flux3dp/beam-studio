describe('landing', () => {
  before(() => {
    cy.visit('/');
  });

  it('home page', () => {
    cy.get('div.home').should('exist');
    cy.get('h1.headline').should('have.text', 'Select Language');
    cy.get('select#select-lang').select('zh-tw');
    cy.get('h1.headline').should('have.text', '請選擇你想使用的語言');
    cy.get('select#select-lang').select('en');
    cy.get('a.btn').click();
  });

  it('machine model selection page', () => {
    const prefix = '_-_-packages-core-src-web-app-pages-SelectMachineModel';
    cy.visit('#/initialize/connect/select-machine-model');
    cy.url({ timeout: 15000 }).should('contain', '#/initialize/connect/select-machine-model');
    cy.get(`div[class^="${prefix}"]`).should('exist');
    cy.get(`div[class^="${prefix}-module__main"] div[class^="${prefix}-module__btn--"]`).should('have.length', 4);
    cy.contains('Skip').click();
    window.localStorage.setItem('new-user', 'true');
  });

  it('land to canvas', () => {
    cy.visit('#/studio/beambox');
    cy.url({ timeout: 15000 }).should('contain', '#/studio/beambox');

    // Sentry
    cy.get('div.ant-modal-body').should('exist');
    cy.get('button[class^="ant-btn"]').contains('No').click();

    // Camera Calibration
    cy.get('body').then((body) => {
      if (body.find('div.ant-modal-body').length > 0) {
        cy.get('button[class^="ant-btn"]').contains('No').click();
      }
    });
    // Tutorial
    cy.get('body').then((body) => {
      if (body.find('div.ant-modal-body').length > 0) {
        cy.get('button[class^="ant-btn"]').contains('No').click();
      }
    });

    // change log
    cy.get('div.ant-modal-body').should('exist');
    cy.get('button[class^="ant-btn"]').contains('OK').click();

    cy.get('div.ant-modal-body').should('not.exist');
    cy.get('#root').find('div').should('have.class', 'studio-container beambox-studio en');
  });
});
