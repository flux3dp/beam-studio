const setStorage = () => {
  window.localStorage.setItem('printer-is-ready', 'true');
  window.localStorage.setItem('keep-flux-id-login', 'true');
  window.localStorage.setItem('enable-sentry', 'false');
  window.localStorage.setItem(
    'alert-config',
    JSON.stringify({ 'skip-interface-tutorial': true, 'done-first-cali': true }),
  );
  window.localStorage.setItem('last-installed-version', 'web');
  window.localStorage.setItem('did-gesture-tutorial', '1');
  window.localStorage.setItem('beambox-preference', '{"font-convert":"2.0", "auto-switch-tab": false}');
  window.localStorage.setItem('announcement-record', '{"times":1,"isIgnored":[], "skip":true}');
};

const landEditor = () => {
  setStorage();
  cy.visit('/#/studio/beambox', { failOnStatusCode: false });
  cy.on('window:load', (win) => {
    win.onbeforeunload = null;
  });
  cy.get('.studio-container', { timeout: 30000 }).should('be.visible');
  cy.window().its('svgCanvas', { timeout: 10000 }).should('exist');
};

describe('probe', () => {
  it('full login flow', () => {
    landEditor();
    cy.getMenuItem(['Account'], 'Log in or Sign Up').click();
    cy.get('input#email-input', { timeout: 15000 }).should('be.visible').type(Cypress.env('username'));
    cy.get('input#password-input').should('be.visible').type(Cypress.env('password'));
    cy.get('.ant-modal-content').contains('button', 'Log in').click({ force: true });
    // Successfully logged in confirm
    cy.contains('.ant-modal-content', 'Successfully logged in', { timeout: 20000 }).should('exist');
    cy.contains('.ant-modal-content button', 'OK').click({ force: true });
    // FluxCredit dialog with AI Credit
    cy.wait(1500);
    cy.document().then((doc) => {
      const modalText = Array.from(doc.querySelectorAll('.ant-modal-content')).map((e) => (e.textContent || '').slice(0, 300));
      const aiCredit = Array.from(doc.querySelectorAll('[class*="FluxCredit-module__ai-credit"]')).map((e) => e.textContent);
      const closeBtns = doc.querySelectorAll('.ant-modal-close:not([style*="display: none"])').length;
      cy.writeFile('cypress/_probe_out.json', { modalText, aiCredit, closeBtns }, { flag: 'w' });
    });
  });
});
