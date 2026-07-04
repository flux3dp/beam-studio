// My Cloud (雲端儲存) release-test automation.
//
// This spec mutates a REAL FLUX cloud account (production backend), so it only runs
// locally and is fully self-cleaning:
//   - before each test: log in, open My Cloud, DELETE every existing file (defensive sweep)
//     so every test starts from 0 files.
//   - after the suite: best-effort delete of everything left behind. Because Cypress `after`
//     hooks may not run when a test fails mid-way, the defensive sweep at suite start is the
//     real backstop that keeps the account at 0 files.
//
// UI wiring reference:
//   - File menu -> 'My Cloud'       (SHOW_MY_CLOUD -> dialogCaller.showMyCloud)
//   - File menu -> 'Save to Cloud'  (SAVE_TO_CLOUD -> saveToCloud(), always prompts a name,
//                                    always creates a NEW cloud entry)
//   - File menu -> 'Save'           (SAVE_SCENE -> saveFile(); when a cloud file is open it
//                                    re-saves to the SAME uuid, no prompt, no new entry)
//   Grid card:  div[class*="GridFile-module__grid"]
//   Card name:  div[class*="GridFile-module__display"]
//   Hover menu: div[class*="GridFile-module__trigger"] -> .ant-dropdown-menu-item (Open/Rename/
//               Duplicate/Download/Delete)
//   Rename in:  input[class*="GridFile-module__edit"]
//   Thumbnail:  div[class*="GridFile-module__guide-lines"] > img
//   Sort:       div[class*="Head-module__head"] .ant-select
//   File count: div[class*="MyCloud-module__tag"] shows "Free file N/5" (free tier only)

const isRunningAtGithub = Cypress.env('envType') === 'github';

const PREFIX = 'cy-test-';
const MODAL = '.ant-modal-content';
const GRID_CARD = 'div[class*="GridFile-module__grid"]';
const CARD_NAME = 'div[class*="GridFile-module__display"]';
const TRIGGER = 'div[class*="GridFile-module__trigger"]';
const THUMB = 'div[class*="GridFile-module__guide-lines"] > img';
const RENAME_INPUT = 'input[class*="GridFile-module__edit"]';
const SORT_SELECT = 'div[class*="Head-module__head"] .ant-select';

// Draw a rectangle on the canvas so there is content to save.
const drawRect = (x1 = 100, y1 = 100, x2 = 300, y2 = 200) => {
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', x1, y1, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', x2, y2, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('#svg_1', { timeout: 15000 }).should('exist');
};

// Wait for the My Cloud grid to settle: either file cards render or the "no file"
// placeholder shows.
const waitMyCloudLoaded = () => {
  cy.get(MODAL, { timeout: 20000 }).contains('My Cloud').should('be.visible');
  cy.get(MODAL, { timeout: 20000 })
    .find('div[class*="MyCloud-module__placeholder"], ' + GRID_CARD, { timeout: 20000 })
    .should('exist');
};

// Open the My Cloud dialog from the File menu. Because opening My Cloud while logged out
// pops the FLUX ID login modal (forceLoginWrapper), this also fills in credentials from
// Cypress.env('username')/('password') when that modal appears, then continues to the grid.
const openMyCloud = () => {
  cy.getMenuItem(['File'], 'My Cloud').click();
  cy.get(MODAL, { timeout: 20000 }).should('be.visible');
  cy.get('body').then(($body) => {
    if ($body.find('input[placeholder="Email"]').length) {
      cy.get('input[placeholder="Email"]').clear().type(Cypress.env('username'));
      cy.get('input[placeholder="Password"]').clear().type(Cypress.env('password'), { log: false });
      cy.get(MODAL).find('.ant-btn-primary').contains('Log in').click();
    }
  });
  waitMyCloudLoaded();
};

const closeMyCloud = () => {
  cy.get('body').then(($body) => {
    if ($body.find('.ant-modal-close').length) {
      cy.get('.ant-modal-close').first().click({ force: true });
    }
  });
  cy.get(MODAL).should('not.exist');
};

// Save the current scene to the cloud as a NEW file with the given name.
// Handles the SaveFileModal name prompt.
const saveToCloudAs = (name: string) => {
  cy.getMenuItem(['File'], 'Save to Cloud').click();
  // SaveFileModal opens directly in name-editing mode (no uuid passed from the menu).
  cy.get('.ant-modal-content')
    .contains('Save to Cloud')
    .should('be.visible')
    .closest('.ant-modal-content')
    .as('saveModal');
  cy.get('@saveModal').find('input').clear().type(name);
  cy.get('@saveModal').find('.ant-btn-primary').contains('OK').click();
  cy.waitForProgress();
};

// Delete every file currently rendered in the open My Cloud grid, one at a time.
// Re-queries after each delete since the grid re-renders on refresh.
const deleteAllInGrid = () => {
  const deleteNext = () => {
    cy.get('body').then(($body) => {
      const cards = $body.find(GRID_CARD);

      if (cards.length === 0) {
        return;
      }

      // Hover the first card to reveal the ellipsis trigger, then open its menu.
      cy.get(GRID_CARD).first().find('div[class*="GridFile-module__img-container"]').realHover();
      cy.get(GRID_CARD).first().find(TRIGGER).click({ force: true });
      cy.get('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item').contains('Delete').click({ force: true });
      // Confirm delete modal (mask=false, OK button).
      cy.get('.ant-modal-content').contains('delete this file').should('be.visible');
      cy.get('.ant-modal-content')
        .contains('delete this file')
        .closest('.ant-modal-content')
        .find('.ant-btn-primary')
        .contains('OK')
        .click({ force: true });
      cy.waitForProgress();
      // Wait for the grid to shrink (or empty) before deleting the next one.
      cy.get('body', { timeout: 20000 }).should(($b) => {
        expect($b.find(GRID_CARD).length).to.be.lessThan(cards.length);
      });
      deleteNext();
    });
  };

  deleteNext();
};

// Open My Cloud, wipe everything, close. Used as the defensive sweep and final cleanup.
const wipeCloud = () => {
  openMyCloud();
  deleteAllInGrid();
  cy.get(MODAL).find('div[class*="MyCloud-module__placeholder"]', { timeout: 20000 }).should('exist');
  closeMyCloud();
};

describe('my cloud', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => cy.log('skip My Cloud test on github (needs production cloud + stateful account)'));

    return;
  }

  beforeEach(() => {
    cy.landingEditor();
    // Defensive sweep: log in (via the My Cloud login modal, using Cypress.env creds) and
    // start every test from a known-empty account.
    wipeCloud();
  });

  after(() => {
    // Best-effort final cleanup. `after` may not run on mid-test failure, which is why the
    // per-test defensive sweep above is the real backstop.
    cy.landingEditor();
    wipeCloud();
  });

  it('saves a new file to the cloud and shows it in My Cloud', () => {
    const name = `${PREFIX}first`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    cy.get(CARD_NAME).should('have.text', name);
    closeMyCloud();
  });

  it('Save updates the same entry, Save to Cloud creates a new one', () => {
    const name = `${PREFIX}savevs`;

    // Create the initial cloud file and open it so it becomes the current cloud file.
    drawRect();
    saveToCloudAs(name);
    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    // Double-click opens the file (sets current cloud uuid) and closes the dialog.
    cy.get(GRID_CARD).first().find('div[class*="GridFile-module__img-container"]').dblclick({ force: true });
    cy.get(MODAL, { timeout: 20000 }).should('not.exist');
    cy.waitForProgress();

    // Modify the scene, then Save (SAVE_SCENE) -> updates the SAME uuid, entry count stays 1.
    drawRect(150, 150, 350, 300);
    cy.getMenuItem(['File'], 'Save').click();
    cy.waitForProgress();
    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    cy.get(CARD_NAME).should('have.text', name);
    closeMyCloud();

    // Save to Cloud (SAVE_TO_CLOUD) with the SAME name -> creates a NEW entry (同名允許).
    saveToCloudAs(name);
    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 2);
    cy.get(CARD_NAME).each(($el) => expect($el.text()).to.eq(name));
    closeMyCloud();
  });

  it('renames a file and the list updates', () => {
    const name = `${PREFIX}rename-src`;
    const newName = `${PREFIX}rename-dst`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    // Open the card menu -> Rename -> type new name -> blur to commit.
    cy.get(GRID_CARD).first().find('div[class*="GridFile-module__img-container"]').realHover();
    cy.get(GRID_CARD).first().find(TRIGGER).click({ force: true });
    cy.get('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item').contains('Rename').click({ force: true });
    cy.get(RENAME_INPUT).should('be.visible').clear().type(newName);
    cy.get(RENAME_INPUT).blur();
    cy.waitForProgress();

    cy.get(CARD_NAME, { timeout: 20000 }).should('have.text', newName);
    cy.get(GRID_CARD).should('have.length', 1);
    closeMyCloud();
  });

  it('duplicates a file and the copy appears', () => {
    const name = `${PREFIX}dup`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    cy.get(GRID_CARD).first().find('div[class*="GridFile-module__img-container"]').realHover();
    cy.get(GRID_CARD).first().find(TRIGGER).click({ force: true });
    cy.get('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item')
      .contains('Duplicate')
      .click({ force: true });
    cy.waitForProgress();

    // Duplicate refreshes the list and puts the new copy into rename mode; commit the name.
    cy.get(GRID_CARD, { timeout: 20000 }).should('have.length', 2);
    // Dismiss the auto-opened rename input (if present) by blurring so it does not swallow clicks.
    cy.get('body').then(($body) => {
      if ($body.find(RENAME_INPUT).length) {
        cy.get(RENAME_INPUT).blur();
      }
    });
    closeMyCloud();
  });

  it('deletes a file and it disappears from the list', () => {
    const name = `${PREFIX}del`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    deleteAllInGrid();
    cy.get(MODAL).find('div[class*="MyCloud-module__placeholder"]', { timeout: 20000 }).should('exist');
    cy.get(GRID_CARD).should('have.length', 0);
    closeMyCloud();
  });

  it('sorts files by name A-Z and Z-A', () => {
    // Names chosen so alphabetical order is unambiguous.
    const names = [`${PREFIX}b-mid`, `${PREFIX}a-first`, `${PREFIX}c-last`];

    names.forEach((name) => {
      drawRect();
      saveToCloudAs(name);
    });

    const sortedAsc = [...names].sort();
    const sortedDesc = [...sortedAsc].reverse();

    const setSort = (label: string) => {
      cy.get(SORT_SELECT).click();
      cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content')
        .contains(label)
        .click({ force: true });
    };

    const assertOrder = (expected: string[]) => {
      cy.get(CARD_NAME).should('have.length', expected.length);
      cy.get(CARD_NAME).then(($els) => {
        const actual = [...$els].map((el) => el.textContent);

        expect(actual).to.deep.eq(expected);
      });
    };

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', names.length);

    setSort('Name: A - Z');
    assertOrder(sortedAsc);

    setSort('Name: Z - A');
    assertOrder(sortedDesc);

    closeMyCloud();
  });

  it('renders a thumbnail image with a non-empty src for each file', () => {
    const name = `${PREFIX}thumb`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    cy.get(THUMB, { timeout: 20000 })
      .should('exist')
      .and('have.attr', 'src')
      .and('match', /\S/);
    closeMyCloud();
  });

  it('enforces the 5-file storage limit and shows an error on the 6th save', () => {
    // First determine the account tier from the My Cloud header: free tier shows "Free file N/5".
    openMyCloud();

    cy.get('body').then(($body) => {
      const isFreeTier = $body.find('div[class*="MyCloud-module__tag"]').length > 0;

      if (!isFreeTier) {
        cy.log('Account is paid/unlimited (no "Free file N/5" tag) — 5-file limit does not apply. Skipping limit assertion.');
        closeMyCloud();

        return;
      }

      closeMyCloud();

      // Fill the account up to the 5-file limit.
      for (let i = 1; i <= 5; i += 1) {
        drawRect();
        saveToCloudAs(`${PREFIX}limit-${i}`);
      }

      openMyCloud();
      cy.get(GRID_CARD).should('have.length', 5);
      cy.get('div[class*="MyCloud-module__tag"]').invoke('text').should('match', /5\s*\/\s*5/);
      closeMyCloud();

      // Attempt a 6th save -> storage-limit error popup (lang: my_cloud.save_file.storage_limit_exceeded).
      drawRect();
      cy.getMenuItem(['File'], 'Save to Cloud').click();
      cy.get('.ant-modal-content').contains('Save to Cloud').should('be.visible').closest('.ant-modal-content').as('m6');
      cy.get('@m6').find('input').clear().type(`${PREFIX}limit-6`);
      cy.get('@m6').find('.ant-btn-primary').contains('OK').click();
      cy.waitForProgress();

      // Error alert should surface the storage-limit message.
      cy.get('.ant-modal-content', { timeout: 20000 })
        .contains('cloud storage has reached upper limit')
        .should('be.visible');
      // Dismiss the error popup.
      cy.get('.ant-modal-content')
        .contains('cloud storage has reached upper limit')
        .closest('.ant-modal-content')
        .find('.ant-btn')
        .first()
        .click({ force: true });

      // Confirm still 5 files (6th was rejected).
      openMyCloud();
      cy.get(GRID_CARD).should('have.length', 5);
      closeMyCloud();
    });
  });
});
