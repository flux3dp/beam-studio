// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --

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

// Progress indicator selectors used across the app
const PROGRESS_SELECTORS = {
  progress: '.progress',
  alertProgress: 'div[class*="AlertAndProgress-module__nonstop--"]',
  modalBody: 'div.ant-modal-body',
};

/**
 * Landing editor command with session caching support.
 *
 * Uses cy.session() to cache localStorage setup across tests,
 * reducing setup time significantly. The session caches the storage state,
 * while each test still visits the page to get a fresh DOM and svgCanvas.
 *
 * @param opts - Cypress visit options (onBeforeLoad, etc.)
 *               Note: When custom opts are provided, session caching is skipped
 *               to ensure the custom hooks are applied correctly.
 */
Cypress.Commands.add('landingEditor', (opts: Partial<Cypress.VisitOptions> = {}) => {
  const hasCustomOptions = Object.keys(opts).length > 0;

  if (hasCustomOptions) {
    // Skip session caching when custom options are provided (e.g., onBeforeLoad)
    // These need to run fresh each time
    setStorage();
    cy.visit('/#/studio/beambox', { ...opts, failOnStatusCode: false });
  } else {
    // Use session caching for standard editor landing
    cy.session(
      'editor-storage',
      () => {
        // Session setup: configure localStorage
        setStorage();
        // Visit once to ensure the session is properly initialized
        cy.visit('/#/studio/beambox', { failOnStatusCode: false });
        cy.get('[title="Start Work"]', { timeout: 30000 }).should('be.visible');
      },
      {
        cacheAcrossSpecs: true,
        validate() {
          // Validate that our storage items still exist
          cy.window().then((win) => {
            expect(win.localStorage.getItem('printer-is-ready')).to.eq('true');
          });
        },
      },
    );

    // After session restore, visit the editor to get fresh DOM/svgCanvas
    cy.visit('/#/studio/beambox', { failOnStatusCode: false });
  }

  cy.on('window:load', (win) => {
    win.onbeforeunload = null;
  });
  // Use GoButton to detect frontend render - this naturally waits for page load
  cy.get('[title="Start Work"]', { timeout: 30000 }).should('be.visible');
  // Wait for svgCanvas to be available on window object
  cy.window().its('svgCanvas', { timeout: 3000 }).should('exist');
});

/**
 * Wait for progress/loading indicators to disappear
 * More reliable than arbitrary cy.wait() calls
 */
Cypress.Commands.add('waitForProgress', (timeout = 10000) => {
  cy.get(PROGRESS_SELECTORS.progress, { timeout }).should('not.exist');
});

/**
 * Wait for heavy operations like image processing to complete
 * Checks both progress indicators and modal states
 */
Cypress.Commands.add('waitForImageProcessing', (timeout = 15000) => {
  // Wait for any progress indicators to disappear
  cy.get('body').then(($body) => {
    if ($body.find(PROGRESS_SELECTORS.progress).length > 0) {
      cy.get(PROGRESS_SELECTORS.progress, { timeout }).should('not.exist');
    }
    if ($body.find(PROGRESS_SELECTORS.alertProgress).length > 0) {
      cy.get(PROGRESS_SELECTORS.alertProgress, { timeout }).should('not.exist');
    }
  });
});

Cypress.Commands.add('loginAndLandingEditor', (opts: Partial<Cypress.VisitOptions> = {}) => {
  setStorage();

  window.localStorage.setItem('printer-is-ready', 'false');
  cy.visit('/#/initialize/connect/flux-id-login', opts);
  cy.on('window:load', (win) => {
    win.onbeforeunload = null;
  });
  const username = Cypress.env('username');
  const password = Cypress.env('password');

  cy.get('input#email-input').type(username);
  cy.get('input#password-input').type(password);
  cy.get('button[class^="ant-btn"]').contains('Login').click({ force: true });
  cy.get('.ant-modal-content').should('exist').and('have.text', 'Successfully logged in.OK');
  cy.contains('button span', 'OK').click();
  // Wait for svgCanvas to be available instead of arbitrary wait
  cy.window().its('svgCanvas', { timeout: 5000 }).should('exist');
});

Cypress.Commands.add('uploadFile', (fileName: string, fileType = '') => {
  cy.get('input[data-file-input="import_image"').then(($input) => {
    cy.fixture(fileName, 'base64')
      .then(Cypress.Blob.base64StringToBlob)
      .then((blob) => {
        const el = $input[0] as HTMLInputElement;
        const testFile = new File([blob], fileName, { type: fileType });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(testFile);
        el.files = dataTransfer.files;
        return cy.wrap($input).first().trigger('change', { force: true });
      });
  });
});

/**
 * Upload a bitmap image (PNG, JPG) and wait for it to be fully processed
 * This is a convenience wrapper around uploadFile that automatically waits
 * for the image element to have valid base64 data in xlink:href
 *
 * @param fileName - The fixture file name (e.g., 'flux.png')
 * @param options - Optional configuration
 * @param options.selector - Element selector to wait for (default: '#svg_1')
 * @param options.timeout - Max wait time in ms (default: 15000)
 */
Cypress.Commands.add('uploadImage', (fileName: string, options?: { selector?: string; timeout?: number }) => {
  const { selector = '#svg_1', timeout = 15000 } = options || {};

  // Determine file type from extension
  const ext = fileName.split('.').pop()?.toLowerCase();
  const fileTypeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  const fileType = fileTypeMap[ext || ''] || 'image/png';

  // Upload the file
  cy.uploadFile(fileName, fileType);

  // Wait for the image to be processed (element exists with valid base64 data)
  cy.get(selector, { timeout })
    .should('exist')
    .should('have.attr', 'xlink:href')
    .and('match', /^data:image\//);
});

Cypress.Commands.add('dragTo', { prevSubject: 'element' }, (subject, targetEl) => {
  cy.wrap(subject).trigger('dragstart', { force: true });
  cy.get(targetEl).trigger('dragenter', { force: true });
  cy.get(targetEl).trigger('dragend', { force: true });
});

Cypress.Commands.add('disableImageDownSampling', () => {
  const bbPref = JSON.parse(window.localStorage.getItem('beambox-preference'));
  bbPref.image_downsampling = false;
  window.localStorage.setItem('beambox-preference', JSON.stringify(bbPref));
});

Cypress.Commands.add('setUpBackend', (ip: string) => {
  window.localStorage.setItem('host', ip);
});

Cypress.Commands.add('connectMachine', (machineName: string) => {
  cy.findByTestId('select-machine').should('exist');
  cy.findByTestId('select-machine').click();
  cy.findByText(machineName).should('exist');
  cy.findByText(machineName).click();
  cy.get('.ant-modal-footer .ant-btn-primary', { timeout: 150000 }).contains('Yes').click();
  cy.findByTestId('select-machine').contains(machineName).should('exist');
});

Cypress.Commands.add('go2Preference', (handleSave = false) => {
  cy.get('div.top-bar-menu-container').click({ timeout: 10000 });
  cy.get('ul.rc-menu--dir-bottom>li.rc-menu__submenu').should('have.length', 7);
  cy.get('.rc-menu__submenu').contains('File').click();
  cy.get('.rc-menu__submenu').contains('Preferences').click();
  if (handleSave) cy.get('button.ant-btn').contains("Don't Save").click();
});

Cypress.Commands.add('checkToolBtnActive', (id: string, active = true) => {
  cy.get(`div#left-${id}`).should('exist');
  cy.get(`div#left-${id}[class*='LeftPanelButton-module__active']`).should(active ? 'exist' : 'not.exist');
});

Cypress.Commands.add('clickToolBtn', (id: string, checkActive = true) => {
  cy.get(`div#left-${id}`).should('exist');
  cy.get(`div#left-${id}`).click({ timeout: 15000, force: true });
  if (checkActive) cy.checkToolBtnActive(id);
});

Cypress.Commands.add('changeWorkarea', (workarea: string, save = true) => {
  cy.get('div.menu-btn-container').click();
  cy.get('.rc-menu__submenu').contains('Edit').click();
  cy.contains('Document Settings').click();
  cy.get('#workareaSelect').closest('.ant-select').as('select');
  cy.get('@select').find('.ant-select-selection-item').click();
  cy.get('@select').should('have.class', 'ant-select-open');
  cy.get('.ant-select-item-option-content').contains(workarea).click({ force: true });
  if (save) cy.get('button.ant-btn').contains('Save').click({ force: true });
});

Cypress.Commands.add('selectPreset', (presetName: string | RegExp) => {
  const ConfigPanelPrefix = 'ConfigPanel-module__';

  cy.get(`[class*="${ConfigPanelPrefix}preset-dropdown"] > .ant-select-selector`).click();
  cy.get('.ant-select-item').contains(presetName).click();
});

Cypress.Commands.add('inputValueCloseTo', (selector: string, value: number, tolerance: number) => {
  cy.get(selector)
    .invoke('val')
    .then((val) => {
      expect(parseFloat(val as string)).to.be.closeTo(value, tolerance);
    });
});

Cypress.Commands.add('inputText', (value: string) => {
  cy.realType(value);
});

Cypress.Commands.add('getElementTitle', (childSelector = '') => {
  const elementTitleModulePrefix = 'ElementTitle-module__';
  const selectors = [`[class*="${elementTitleModulePrefix}element-title"]`];

  if (childSelector) selectors.push(childSelector);

  return cy.get(selectors.join(' '));
});

Cypress.Commands.add('getTopBar', (childSelector = '') => {
  const topBarModulePrefix = 'TopBar-module__';
  const selectors = [`[class*="${topBarModulePrefix}top-bar"]`];

  if (childSelector) selectors.push(childSelector);

  return cy.get(selectors.join(' '));
});

Cypress.Commands.add('moveElementToLayer', (targetLayer: string, needConfirm = true) => {
  // Wait for select to be rendered (depends on SelectedElementContext update)
  cy.findByTestId('move-layer-select', { timeout: 10000 }).should('exist').find('.ant-select-selector').click();
  cy.get('.ant-select-item').contains(targetLayer).click();
  if (needConfirm) cy.get('.ant-btn').contains('Yes').click();
});
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
