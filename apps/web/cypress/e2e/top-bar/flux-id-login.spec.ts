// FLUX ID login (release-test rows: FLUX ID 登入 / 登入資訊 icon + AI Credit / 記住登入 / 一鍵去背跳出).
//
// This spec drives the *production* FLUX ID service (real network login), so it self-skips on CI
// (no outbound auth service there) and belongs to the local-rig batch. Credentials come from
// Cypress.env('username')/('password') — never hard-coded.
//
// Behaviour discovered while writing this spec:
// - The stand-alone login route (/#/initialize/connect/flux-id-login) does NOT render the login
//   dialog reliably in the Cypress build, so instead we open the login dialog the way a user does:
//   Account menu -> "Log in or Sign Up" (Dialog.showLoginDialog, useMenuData.ts / menuActions.ts).
//   The dialog exposes #email-input, #password-input, a remember-me checkbox and a "Log in" button.
// - On success the app opens the FLUX Credit dialog (dialogCaller.showFluxCreditDialog / FluxCredit.tsx)
//   whose body reads "Logged in ... Email: <email> ... AI Credit: <n> ... Log out". This is the
//   surface that renders the AI Credit value (span[class*="FluxCredit-module__ai-credit"]). Login also
//   persists the session via a same-site cookie (axios withCredentials) plus localStorage
//   `keep-flux-id-login`, and app init calls getInfo() so a reload restores the logged-in user.
// - The logged-in identity is surfaced in the top-bar Account menu as "Log out (<email>)"
//   (useMenuData.ts accountMenu); logged out it reads "Log in or Sign Up".
// - There is no user avatar in the web top bar (UserAvatar is unused on web); the Account menu is the
//   identity surface, and the FLUX Credit dialog is the credit surface.
// - 一鍵去背 = the image ActionsPanel "Background Removal" button (#bg-removal). For a logged-in user
//   with credit and the reminder not yet skipped, clicking it first pops a confirm alert
//   ("...immediately use 0.02 Credit, do you want to continue?"). We assert that popup appears and
//   Cancel out — so no credit is consumed and no real background-removal network call is made.
//
// To be gentle on the production service we log in exactly ONCE (before()) and reuse the session
// across the four assertions, logging out once at the end.

const isRunningAtGithub = Cypress.env('envType') === 'github';

// testIsolation is disabled for this suite: the four assertions intentionally share ONE production
// FLUX ID login (gentle on the auth service). With the default testIsolation:true, Cypress clears
// cookies/localStorage between tests, which would drop the session and break the "remember login"
// assertion. The suite still logs out in after() so nothing leaks to other specs.
describe('FLUX ID login', { testIsolation: false }, () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => cy.log('skip test on github'));

    return;
  }

  const username = Cypress.env('username');
  const password = Cypress.env('password');

  const setStorage = () => {
    window.localStorage.setItem('printer-is-ready', 'true');
    window.localStorage.setItem('keep-flux-id-login', 'true');
    window.localStorage.setItem('enable-sentry', 'false');
    window.localStorage.setItem(
      'alert-config',
      JSON.stringify({ 'done-first-cali': true, 'skip-interface-tutorial': true }),
    );
    window.localStorage.setItem('last-installed-version', 'web');
    window.localStorage.setItem('did-gesture-tutorial', '1');
    window.localStorage.setItem('beambox-preference', '{"font-convert":"2.0", "auto-switch-tab": false}');
    window.localStorage.setItem('announcement-record', '{"times":1,"isIgnored":[], "skip":true}');
  };

  const waitEditorReady = () => {
    cy.get('#root').should('exist');
    cy.get('.studio-container', { timeout: 30000 }).should('be.visible');
    cy.get('[title="Start Work"]', { timeout: 30000 }).should('exist');
    cy.window().its('svgCanvas', { timeout: 10000 }).should('exist');
  };

  // Land the editor with the current session preserved (does NOT clear cookies). A hash-only visit
  // does not reload when we are already on /#/studio/beambox, so we cy.reload() to guarantee a fresh
  // mount and clear any leftover canvas/modal state from a previous test (testIsolation is off).
  const landEditor = () => {
    setStorage();
    cy.visit('/#/studio/beambox', { failOnStatusCode: false });
    cy.reload();
    cy.on('window:load', (win) => {
      win.onbeforeunload = null;
    });
    waitEditorReady();
  };

  const closeVisibleModal = () => {
    cy.get('body').then(($body) => {
      if ($body.find('.ant-modal-close:visible').length > 0) {
        cy.get('.ant-modal-close:visible').first().click({ force: true });
      }
    });
  };

  const accountMenuIncludes = (text: string) =>
    cy.document().then((doc) =>
      Array.from(doc.querySelectorAll('ul[aria-label="Menu"] .szh-menu__item')).some((el) =>
        (el.textContent || '').includes(text),
      ),
    );

  // Ensure we start logged out so the login flow is deterministic and re-runnable.
  const ensureLoggedOut = () => {
    landEditor();
    cy.getMenuItem(['Account'], 'Design Market').should('exist');

    accountMenuIncludes('Log out').then((loggedIn) => {
      if (loggedIn) {
        cy.getMenuItem(['Account'], 'Log out').click();
        cy.getMenuItem(['Account'], 'Log in or Sign Up').should('exist');
      }
    });

    cy.get('body').type('{esc}');
  };

  before(() => {
    ensureLoggedOut();

    // Log in via the Account menu -> "Log in or Sign Up" dialog.
    landEditor();
    cy.getMenuItem(['Account'], 'Log in or Sign Up').click();
    cy.get('input#email-input', { timeout: 15000 }).should('be.visible').clear().type(username);
    cy.get('input#password-input').should('be.visible').clear().type(password, { log: false });
    cy.get('.ant-modal-content').contains('button', 'Log in').click({ force: true });

    // On success the FLUX Credit dialog appears with the "AI Credit" value — proves login succeeded.
    cy.contains('.ant-modal-content', 'AI Credit', { timeout: 20000 }).should('exist');
  });

  after(() => {
    // Log out once so the session does not leak into other specs sharing the browser profile.
    landEditor();
    accountMenuIncludes('Log out').then((loggedIn) => {
      if (loggedIn) {
        cy.getMenuItem(['Account'], 'Log out').click();
        cy.getMenuItem(['Account'], 'Log in or Sign Up').should('exist');
      }
    });
  });

  it('shows the account info (AI Credit) in the FLUX Credit dialog right after login', () => {
    // The FLUX Credit dialog is still open from the before() login.
    cy.contains('.ant-modal-content', 'Logged in').should('exist');
    cy.contains('.ant-modal-content', `Email: ${username}`).should('exist');

    // AI Credit renders a parseable numeric value (assert the field, not a specific number).
    cy.get('[class*="FluxCredit-module__ai-credit"]')
      .should('exist')
      .invoke('text')
      .then((text) => {
        expect(text.trim(), 'AI credit value should be numeric').to.match(/^-?\d+(\.\d+)?$/);
      });

    closeVisibleModal();
  });

  it('shows the logged-in identity in the Account menu', () => {
    closeVisibleModal();
    landEditor();

    // Account menu now offers "Log out (<email>)" instead of "Log in or Sign Up".
    cy.getMenuItem(['Account'], 'Log out').should('exist').invoke('text').should('include', username);

    accountMenuIncludes('Log in or Sign Up').should('eq', false);
  });

  it('remembers the login across a page reload', () => {
    closeVisibleModal();
    landEditor();

    // Sanity: logged in before reload.
    cy.getMenuItem(['Account'], 'Log out').should('exist');
    cy.get('body').type('{esc}');

    // Reload; the persisted session (cookie + keep-flux-id-login) must survive.
    cy.reload();
    cy.on('window:load', (win) => {
      win.onbeforeunload = null;
    });
    cy.get('.studio-container', { timeout: 30000 }).should('be.visible');
    cy.window().its('svgCanvas', { timeout: 10000 }).should('exist');

    // Still logged in: Account menu still shows "Log out (<email>)", no forced login dialog.
    cy.getMenuItem(['Account'], 'Log out').should('exist').invoke('text').should('include', username);
  });

  it('pops up the one-click background removal (一鍵去背) confirmation', () => {
    closeVisibleModal();
    landEditor();

    // Import a bitmap and select it so the image ActionsPanel is shown.
    cy.uploadImage('flux.png');
    cy.get('#svg_1').should('exist').click({ force: true });

    // Ensure the right-panel Objects tab (where ActionsPanel lives) is active.
    cy.get('body').then(($body) => {
      if ($body.find('#rightPanelObject-tab').length > 0) {
        cy.get('#rightPanelObject-tab').click({ force: true });
      }
    });

    // Trigger the Background Removal action (#bg-removal in ActionsPanel).
    cy.get('#bg-removal', { timeout: 10000 }).should('exist').click({ force: true });

    // For a logged-in user with credit, a confirm alert pops up first
    // ("...immediately use 0.02 Credit, do you want to continue?"). Assert it appears — this is the
    // "only test that it pops up" requirement — then Cancel so no credit is spent / no removal runs.
    cy.contains('.ant-modal-content', 'Credit', { timeout: 10000 }).should('exist');
    cy.get('.ant-modal-content')
      .contains('button', /Cancel|取消/)
      .click({ force: true });

    // The confirm dialog dismisses and no removal processing overlay remains.
    cy.get('#photo-edit-processing').should('not.exist');
  });
});
