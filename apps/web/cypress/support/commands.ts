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
  window.localStorage.setItem('enable-sentry', '0');
  window.localStorage.setItem('alert-config', JSON.stringify({
    'skip-interface-tutorial': true,
    'done-first-cali': true,
  }));
  window.localStorage.setItem('last-installed-version', 'web');
  window.localStorage.setItem('questionnaire-version', '9999');
  window.localStorage.setItem('did-gesture-tutorial', '1');
  window.localStorage.setItem('beambox-preference', '{"font-convert":"2.0", "auto-switch-tab": false}');
  window.localStorage.setItem('announcement-record', '{"times":1,"isIgnored":[], "skip":true}');
};

Cypress.Commands.add('landingEditor', (opts = {}) => {
  setStorage();
  cy.visit('/#/initialize/connect/flux-id-login', opts);
  cy.on('window:load', (win) => {
    // eslint-disable-next-line no-param-reassign
    win.onbeforeunload = null;
  });
  cy.contains('Work Offline', { timeout: 30000 }).click();
  // time for svgcanvas loading
  cy.wait(1000);
  // Use GoButton to detect frontend render
  cy.get('.top-bar [title="Start Work"]', { timeout: 30000 }).should('exist', { timeout: 30000 });
});

Cypress.Commands.add('loginAndLandingEditor', (opts = {}) => {
  setStorage();
  cy.visit('/#/initialize/connect/flux-id-login', opts);
  cy.on('window:load', (win) => {
    // eslint-disable-next-line no-param-reassign
    win.onbeforeunload = null;
  });
  const username = Cypress.env('username');
  const password = Cypress.env('password');
  cy.get('input#email-input').type(username);
  cy.get('input#password-input').type(password);
  cy.get('button[class^="ant-btn"]').contains('Login').click({ force: true });
  cy.get('.ant-modal-content').should('exist').and('have.text', 'Successfully logged in.OK');
  cy.contains('button span', 'OK').click();
  // time for svgcanvas loading
  cy.wait(1000);
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
  cy.get('div.top-bar-menu-container').click();
  cy.get('ul.rc-menu--dir-bottom>li.rc-menu__submenu').should('have.length', 6);
  cy.get('li.rc-menu__submenu:nth-child(1)').trigger('mouseover');
  cy.get('li.rc-menu__submenu:nth-child(1) li.rc-menu__item:last-child').click();
  if (handleSave) cy.get('button.ant-btn').contains("Don't Save").click();
});

Cypress.Commands.add('checkToolBtnActive', (id: string, active = true) => {
  cy.get(`div#left-${id}`).should('exist');
  cy.get(
    `div#left-${id}[class*='src-web-app-components-beambox-left-panel-LeftPanelButton-module__active--']`
  ).should(active ? 'exist' : 'not.exist');
});

Cypress.Commands.add('clickToolBtn', (id: string) => {
  cy.get(`div#left-${id}`).should('exist');
  cy.get(`div#left-${id}`).click();
  cy.checkToolBtnActive(id);
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

Cypress.Commands.add('selectPreset', (presetName: string) => {
  const ConfigPanelPrefix = 'src-web-app-views-beambox-Right-Panels-ConfigPanel-ConfigPanel-module__';
  cy.get(`[class*="${ConfigPanelPrefix}preset-dropdown"] > .ant-select-selector`).click();
  cy.get('.ant-select-item').contains(presetName).click();
});

Cypress.Commands.add('inputValueCloseTo', (selector: string, value: number, tolerance: number) => {
  cy.get(selector).invoke('val').then((val) => {
    expect(parseFloat(val as string)).to.be.closeTo(value, tolerance);
  });
});

Cypress.Commands.add('inputText', (value: string) => {
  cy.realType(value);
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
