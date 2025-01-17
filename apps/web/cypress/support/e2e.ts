/* eslint-disable prefer-rest-params */
/* eslint-disable no-param-reassign */
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
/* eslint-disable import/no-extraneous-dependencies */
import './commands';
import 'cypress-real-events/support';
import 'cypress-file-upload';
import '@4tw/cypress-drag-drop';
import '@testing-library/cypress/add-commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.on('uncaught:exception', (err, runnable) => false);

Cypress.on('window:before:load', (win) => {
  const original = win.EventTarget.prototype.addEventListener;

  win.EventTarget.prototype.addEventListener = function patcher() {
    if (arguments && arguments[0] === 'beforeunload') {
      return;
    }
    // eslint-disable-next-line consistent-return
    return original.apply(this, arguments);
  };

  Object.defineProperty(win, 'onbeforeunload', {
    get: () => {},
    set: () => {},
  });
});
