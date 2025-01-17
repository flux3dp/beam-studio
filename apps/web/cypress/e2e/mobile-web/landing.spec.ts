describe('mobile landing', () => {
  before(() => {
    cy.viewport('iphone-xr');
    cy.visit('/', {
      onBeforeLoad(window) {
        Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 1 });
      },
    });
  });

  it('check gesture tutorial', () => {
    cy.visit('#/studio/beambox');
    cy.url({ timeout: 15000 }).should('contain', '#/studio/beambox');

    // Sentry
    cy.get('div.ant-modal-body').should('exist');
    cy.get('button.ant-btn').contains('No').click();

    // Gesture Tutorial
    cy.get('img[src="img/touch-drag.svg"]').should('exist');
    cy.get('button.ant-btn').contains('Next').click();
    cy.get('img[src="img/touch-zoom.svg"]').should('exist');
    cy.get('button.ant-btn').contains('Next').click();
    cy.get('source[src="video/touch-select.webm"]').should('exist');
    cy.get('button.ant-btn').contains('Next').click();
    cy.get('source[src="video/touch-multiselect.webm"]').should('exist');
    cy.get('button.ant-btn').contains('Next').click();
    cy.get('source[src="video/touch-contextmenu.webm"]').should('exist');
    cy.get('button.ant-btn').contains('Done').click();
  });
});
