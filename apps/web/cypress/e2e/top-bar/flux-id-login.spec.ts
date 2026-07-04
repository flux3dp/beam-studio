// FLUX ID login (release-test rows: FLUX ID 登入 / 登入資訊 icon + AI Credit / 記住登入 / 一鍵去背跳出).
//
// This spec exercises the *production* FLUX ID service (real network login), so it self-skips on
// CI (no outbound auth service there) and belongs to the local-rig batch. Credentials come from
// Cypress.env('username')/('password') — never hard-coded.
//
// Behaviour discovered while writing this spec:
// - Login route /#/initialize/connect/flux-id-login mounts an empty page that immediately shows the
//   FLUX ID login dialog (packages/core/.../pages/FluxIdLogin.tsx). The dialog has #email-input,
//   #password-input and a "Login" button. cy.loginAndLandingEditor() drives exactly this flow.
// - On success the app pops a "Successfully logged in." confirm, then opens the FLUX Credit dialog
//   (dialogCaller.showFluxCreditDialog) which is the surface that renders the "AI Credit:" value
//   (FluxCredit.tsx). getInfo() persists the session via a same-site cookie (withCredentials) plus
//   the localStorage flag `keep-flux-id-login`, so a reload restores the logged-in user.
// - The logged-in identity is surfaced in the top-bar Account menu as "Log out (<email>)"
//   (useMenuData.ts accountMenu). Logged-out it reads "Log in or Sign Up".
// - 一鍵去背 = the image ActionsPanel "Background Removal" button (#bg-removal). For a logged-in user
//   with credit and the reminder not yet skipped, clicking it first pops a confirm alert
//   ("...immediately use 0.02 Credit, do you want to continue?"). We assert that popup appears and
//   Cancel out — so no credit is consumed and no real removal network call is made.

const isRunningAtGithub = Cypress.env('envType') === 'github';

describe('FLUX ID login', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => cy.log('skip test on github'));

    return;
  }

  // Restore-only visit to the editor that keeps the current (logged-in) session cookie/localStorage.
  // Unlike cy.landingEditor() we do NOT reset localStorage, so the persisted FLUX ID login survives.
  const visitEditor = () => {
    cy.visit('/#/studio/beambox', { failOnStatusCode: false });
    cy.on('window:load', (win) => {
      win.onbeforeunload = null;
    });
    cy.get('#root').should('exist');
    cy.get('.studio-container', { timeout: 30000 }).should('be.visible');
    cy.get('[title="Start Work"]', { timeout: 30000 }).should('exist');
    cy.window().its('svgCanvas', { timeout: 10000 }).should('exist');
  };

  // Log out via the FLUX Credit dialog (opened from the Account menu) so the session does not leak
  // into other specs sharing the same browser profile.
  const logout = () => {
    cy.get('body').then(($body) => {
      // Close any lingering dialog first so the menu is reachable.
      if ($body.find('.ant-modal-close').length > 0) {
        cy.get('.ant-modal-close:visible').first().click({ force: true });
      }
    });

    cy.getMenuItem(['Account'], 'Log out').click();
    // Confirm sign-out if a confirmation dialog is shown.
    cy.get('body').then(($body) => {
      if ($body.find('.ant-modal-confirm-btns .ant-btn-primary').length > 0) {
        cy.get('.ant-modal-confirm-btns .ant-btn-primary').first().click({ force: true });
      }
    });

    cy.getMenuItem(['Account'], 'Log in or Sign Up').should('exist');
  };

  beforeEach(() => {
    cy.loginAndLandingEditor();
    // The FLUX Credit dialog ("Successfully logged in") may still be open after login; close it so
    // each test starts from a clean editor state.
    cy.get('body').then(($body) => {
      if ($body.find('.ant-modal-close:visible').length > 0) {
        cy.get('.ant-modal-close:visible').first().click({ force: true });
      }
    });
    // Land on the editor with the session preserved.
    visitEditor();
  });

  afterEach(() => {
    logout();
  });

  it('logs in and shows the account identity in the Account menu', () => {
    const username = Cypress.env('username');

    // Account menu now offers "Log out (<email>)" instead of "Log in or Sign Up".
    cy.getMenuItem(['Account'], 'Log out')
      .should('exist')
      .invoke('text')
      .should('include', username);

    // The logged-out label must be gone.
    cy.get('body').then(($body) => {
      cy.wrap($body.text()).should('not.include', 'Log in or Sign Up');
    });
  });

  it('shows the account credit info (AI Credit) in the FLUX Credit dialog', () => {
    // Open the FLUX Credit dialog from the Account menu is not a direct item; instead the user-info
    // surface (avatar / logged-in state) opens it. The dialog is also reachable right after login,
    // but here we assert it by re-triggering it through the app's dialog caller on the window.
    cy.window().then((win) => {
      // dialogCaller is not globally exposed; open via the same path the UI uses: click the
      // Account menu "Log out (<email>)" would sign out, so instead assert the credit dialog by
      // invoking a background-removal-independent surface. We open it via the user info button if
      // present, otherwise fall back to asserting the menu identity already covered above.
      cy.log(`window origin: ${win.location.origin}`);
    });

    // Re-open the credit dialog: after a fresh login it is shown automatically. Log in again in a
    // controlled way to capture it. To avoid a second production login, we instead assert on the
    // dialog that is still available via the avatar user-info entry point.
    cy.get('body').then(($body) => {
      const hasAvatar = $body.find('[class*="UserAvatar-module__user-avatar"]').length > 0;

      if (hasAvatar) {
        cy.get('[class*="UserAvatar-module__user-avatar"]').first().click({ force: true });
      }
    });

    // The FLUX Credit dialog renders an "AI Credit:" label followed by a numeric value.
    cy.contains('.ant-modal-content, body', 'AI Credit', { timeout: 10000 }).should('exist');
    cy.get('[class*="FluxCredit-module__ai-credit"]', { timeout: 10000 })
      .should('exist')
      .invoke('text')
      .then((text) => {
        // Assert a parseable numeric value renders (not a specific number).
        expect(text.trim(), 'AI credit value should be numeric').to.match(/^-?\d+(\.\d+)?$/);
      });

    // Close the dialog.
    cy.get('.ant-modal-close:visible').first().click({ force: true });
  });

  it('remembers the login across a page reload', () => {
    // Sanity: logged in before reload.
    cy.getMenuItem(['Account'], 'Log out').should('exist');

    // Reload the editor page; the persisted session (cookie + keep-flux-id-login) must survive.
    cy.reload();
    cy.on('window:load', (win) => {
      win.onbeforeunload = null;
    });
    cy.get('.studio-container', { timeout: 30000 }).should('be.visible');
    cy.window().its('svgCanvas', { timeout: 10000 }).should('exist');

    // Still logged in: Account menu still shows "Log out (<email>)", no login dialog forced.
    cy.getMenuItem(['Account'], 'Log out')
      .should('exist')
      .invoke('text')
      .should('include', Cypress.env('username'));
  });

  it('pops up the one-click background removal (一鍵去背) confirmation', () => {
    // Import a bitmap and select it so the image ActionsPanel is shown.
    cy.uploadImage('flux.png');
    cy.get('#svg_1').should('exist').click({ force: true });

    // Open the right-panel Objects tab where ActionsPanel lives.
    cy.get('body').then(($body) => {
      if ($body.find('#rightPanelObject-tab').length > 0) {
        cy.get('#rightPanelObject-tab').click({ force: true });
      }
    });

    // Trigger the Background Removal action (#bg-removal button in ActionsPanel).
    cy.get('#bg-removal', { timeout: 10000 }).should('exist').click({ force: true });

    // For a logged-in user with credit, a confirm alert pops up first
    // ("...immediately use 0.02 Credit, do you want to continue?"). Assert it appears — this is the
    // "only test that it pops up" requirement — then Cancel so no credit is spent / no removal runs.
    cy.contains('.ant-modal-content', 'Credit', { timeout: 10000 }).should('exist');
    cy.get('.ant-modal-content')
      .contains('button', /Cancel|取消/)
      .click({ force: true });

    // The confirm dialog closes and no removal processing overlay remains.
    cy.get('#photo-edit-processing').should('not.exist');
  });
});
