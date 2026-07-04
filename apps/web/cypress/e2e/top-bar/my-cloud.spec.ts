// My Cloud (雲端儲存) release-test automation.
//
// This spec mutates a REAL FLUX cloud account (production backend `id.flux3dp.com`), so it
// only runs locally (self-skips on CI) and is fully self-cleaning.
//
// IMPORTANT ENVIRONMENT NOTE — CSRF / trusted origins:
//   Cloud *reads* (GET /cloud/list) work from any origin, but cloud *writes*
//   (POST/PUT/DELETE for save / rename / duplicate / delete) are gated by Django CSRF
//   origin checks. The production backend only trusts `*.flux3dp.com` origins
//   (e.g. the prod Cypress config's baseUrl `http://studio.flux3dp.com`). When this spec is
//   served from `http://localhost:8080` the backend rejects every write with:
//     "CSRF Failed: Origin checking failed - http://localhost:8080 does not match any
//      trusted origins."
//   So the write-dependent cases can only pass when the app is served from a trusted
//   `*.flux3dp.com` origin. To stay green everywhere, `before()` sets `cloudWritable` from the
//   serving host (Cypress baseUrl): only `*.flux3dp.com` hosts can write. When writes are
//   blocked, the write cases self-skip with a clear log and only the always-safe assertions
//   (login succeeds, list loads, free-tier header shows N/5) run. Run against a
//   `*.flux3dp.com` origin (e.g. the prod config) to exercise full coverage.
//
// UI wiring reference:
//   - File menu -> 'My Cloud'       (SHOW_MY_CLOUD -> dialogCaller.showMyCloud). Opening it
//                                    while logged out pops the FLUX ID login modal.
//   - File menu -> 'Save to Cloud'  (SAVE_TO_CLOUD -> saveToCloud(), always prompts a name,
//                                    always creates a NEW cloud entry — 同名允許)
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
const IMG_CONTAINER = 'div[class*="GridFile-module__img-container"]';
const TRIGGER = 'div[class*="GridFile-module__trigger"]';
const THUMB = 'div[class*="GridFile-module__guide-lines"] > img';
const RENAME_INPUT = 'input[class*="GridFile-module__edit"]';
const SORT_SELECT = 'div[class*="Head-module__head"] .ant-select';
const TAG = 'div[class*="MyCloud-module__tag"]';
const PLACEHOLDER = 'div[class*="MyCloud-module__placeholder"]';

// Whether the current origin is allowed to perform cloud writes (decided by the `before`
// capability probe). Write-dependent tests self-skip when false.
let cloudWritable = false;

// Draw a rectangle so there is content to save.
const drawRect = (x1 = 100, y1 = 100, x2 = 300, y2 = 200) => {
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', x1, y1, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', x2, y2, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.get('#svg_1', { timeout: 15000 }).should('exist');
};

// Wait for the My Cloud grid to settle: either file cards render or the "no file" placeholder.
const waitMyCloudLoaded = () => {
  cy.get(MODAL, { timeout: 20000 }).contains('My Cloud').should('be.visible');
  cy.get(MODAL, { timeout: 20000 })
    .find(PLACEHOLDER + ', ' + GRID_CARD, { timeout: 20000 })
    .should('exist');
};

// Open the My Cloud dialog. Opening it while logged out pops the FLUX ID login modal, so this
// fills credentials from Cypress.env('username')/('password') when that modal appears.
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

// Fill the SaveFileModal name prompt and confirm. Does NOT assert the save succeeded (callers
// that require success run under `cloudWritable`).
const submitSaveModal = (name: string) => {
  cy.contains('.ant-modal', 'Save to Cloud').should('be.visible').as('saveModal');
  cy.get('@saveModal').find('input').clear().type(name);
  // Footer default OK button — text is locale-dependent, so target by role not text.
  cy.get('@saveModal').find('.ant-modal-footer .ant-btn-primary').click();
  cy.waitForProgress();
};

// Save the current scene to the cloud as a NEW file with the given name (write path).
const saveToCloudAs = (name: string) => {
  cy.getMenuItem(['File'], 'Save to Cloud').click();
  submitSaveModal(name);
};

// Delete every file currently rendered in the open My Cloud grid, one at a time.
const deleteAllInGrid = () => {
  const deleteNext = () => {
    cy.get('body').then(($body) => {
      const count = $body.find(GRID_CARD).length;

      if (count === 0) {
        return;
      }

      cy.get(GRID_CARD).first().find(IMG_CONTAINER).realHover();
      cy.get(GRID_CARD).first().find(TRIGGER).click({ force: true });
      cy.get('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item').contains('Delete').click({ force: true });
      cy.contains('.ant-modal', 'delete this file').should('be.visible').as('deleteModal');
      cy.get('@deleteModal').find('.ant-modal-footer .ant-btn-primary').click({ force: true });
      cy.waitForProgress();
      cy.get('body', { timeout: 20000 }).should(($b) => {
        expect($b.find(GRID_CARD).length).to.be.lessThan(count);
      });
      deleteNext();
    });
  };

  deleteNext();
};

// Open My Cloud, delete everything, close. Only attempts deletes when writes are allowed.
const wipeCloud = () => {
  openMyCloud();

  if (cloudWritable) {
    deleteAllInGrid();
    cy.get(MODAL).find(PLACEHOLDER, { timeout: 20000 }).should('exist');
  }

  closeMyCloud();
};

const logSkip = (why: string) => cy.log(`SKIP (${why}): cloud writes are blocked from this origin (CSRF trusted-origins).`);

describe('my cloud', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => cy.log('skip My Cloud test on github (needs production cloud + stateful account)'));

    return;
  }

  before(() => {
    // Decide whether this origin can perform cloud writes. Cloud writes to id.flux3dp.com are
    // gated by Django CSRF trusted-origins, which only include *.flux3dp.com hosts. Reads
    // (list) work from any origin. Rather than provoke a blocking CSRF error popup in the UI
    // (which would obstruct the top menu), decide purely from the serving origin (baseUrl).
    const baseUrl = Cypress.config('baseUrl') || '';
    const hostname = (() => {
      try {
        return new URL(baseUrl).hostname;
      } catch {
        return '';
      }
    })();

    cloudWritable = /\.flux3dp\.com$/.test(hostname);

    if (cloudWritable) {
      cy.log(`Cloud writes ALLOWED from ${baseUrl} — running full coverage.`);
    } else {
      cy.log(`Cloud writes BLOCKED from ${baseUrl} (CSRF trusted-origins). Write cases self-skip.`);
    }
  });

  beforeEach(() => {
    cy.landingEditor();
    // Defensive sweep: log in and (when writable) empty the account before each test.
    wipeCloud();
  });

  after(() => {
    // Best-effort final cleanup. Only meaningful when writes are allowed; otherwise nothing
    // was ever created and the account is already at its pre-existing state.
    if (!cloudWritable) {
      return;
    }

    cy.landingEditor();
    wipeCloud();
  });

  it('login succeeds and My Cloud loads with the free-tier limit shown', () => {
    // Always-safe (read-only) coverage: after the beforeEach login, open My Cloud and assert
    // the account is reachable and the free-tier header renders "N/5".
    openMyCloud();
    cy.get(TAG).should('exist').invoke('text').should('match', /\d+\s*\/\s*5/);
    closeMyCloud();
  });

  it('saves a new file to the cloud and shows it in My Cloud', function () {
    if (!cloudWritable) {
      logSkip('save-new');
      this.skip();
    }

    const name = `${PREFIX}first`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    cy.get(CARD_NAME).should('have.text', name);
    closeMyCloud();
  });

  it('Save updates the same entry, Save to Cloud creates a new one', function () {
    if (!cloudWritable) {
      logSkip('save-vs-save-as');
      this.skip();
    }

    const name = `${PREFIX}savevs`;

    drawRect();
    saveToCloudAs(name);
    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    // Double-click opens the file (sets current cloud uuid) and closes the dialog.
    cy.get(GRID_CARD).first().find(IMG_CONTAINER).dblclick({ force: true });
    cy.get(MODAL, { timeout: 20000 }).should('not.exist');
    cy.waitForProgress();

    // Modify, then Save (SAVE_SCENE) -> updates the SAME uuid; entry count stays 1.
    drawRect(150, 150, 350, 300);
    cy.getMenuItem(['File'], 'Save').click();
    cy.waitForProgress();
    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    cy.get(CARD_NAME).should('have.text', name);
    closeMyCloud();

    // Save to Cloud with the SAME name -> NEW entry (同名允許).
    saveToCloudAs(name);
    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 2);
    cy.get(CARD_NAME).each(($el) => expect($el.text()).to.eq(name));
    closeMyCloud();
  });

  it('renames a file and the list updates', function () {
    if (!cloudWritable) {
      logSkip('rename');
      this.skip();
    }

    const name = `${PREFIX}rename-src`;
    const newName = `${PREFIX}rename-dst`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    cy.get(GRID_CARD).first().find(IMG_CONTAINER).realHover();
    cy.get(GRID_CARD).first().find(TRIGGER).click({ force: true });
    cy.get('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item').contains('Rename').click({ force: true });
    cy.get(RENAME_INPUT).should('be.visible').clear().type(newName);
    cy.get(RENAME_INPUT).blur();
    cy.waitForProgress();

    cy.get(CARD_NAME, { timeout: 20000 }).should('have.text', newName);
    cy.get(GRID_CARD).should('have.length', 1);
    closeMyCloud();
  });

  it('duplicates a file and the copy appears', function () {
    if (!cloudWritable) {
      logSkip('duplicate');
      this.skip();
    }

    const name = `${PREFIX}dup`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    cy.get(GRID_CARD).first().find(IMG_CONTAINER).realHover();
    cy.get(GRID_CARD).first().find(TRIGGER).click({ force: true });
    cy.get('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item')
      .contains('Duplicate')
      .click({ force: true });
    cy.waitForProgress();

    // Duplicate refreshes the list and puts the new copy into rename mode.
    cy.get(GRID_CARD, { timeout: 20000 }).should('have.length', 2);
    // Commit / dismiss the auto-opened rename input so it does not swallow later clicks.
    cy.get('body').then(($body) => {
      if ($body.find(RENAME_INPUT).length) {
        cy.get(RENAME_INPUT).blur();
      }
    });
    closeMyCloud();
  });

  it('deletes a file and it disappears from the list', function () {
    if (!cloudWritable) {
      logSkip('delete');
      this.skip();
    }

    const name = `${PREFIX}del`;

    drawRect();
    saveToCloudAs(name);

    openMyCloud();
    cy.get(GRID_CARD).should('have.length', 1);
    deleteAllInGrid();
    cy.get(MODAL).find(PLACEHOLDER, { timeout: 20000 }).should('exist');
    cy.get(GRID_CARD).should('have.length', 0);
    closeMyCloud();
  });

  it('sorts files by name A-Z and Z-A', function () {
    if (!cloudWritable) {
      logSkip('sort');
      this.skip();
    }

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
        expect([...$els].map((el) => el.textContent)).to.deep.eq(expected);
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

  it('renders a thumbnail image with a non-empty src for each file', function () {
    if (!cloudWritable) {
      logSkip('thumbnail');
      this.skip();
    }

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

  it('enforces the 5-file storage limit and shows an error on the 6th save', function () {
    // Determine tier from the My Cloud header: free tier shows "Free file N/5".
    openMyCloud();

    cy.get('body').then(($body) => {
      const isFreeTier = $body.find(TAG).length > 0;

      closeMyCloud();

      if (!isFreeTier) {
        cy.log('Account is paid/unlimited (no "Free file N/5" tag) — 5-file limit N/A. Skipping.');
        this.skip();

        return;
      }

      if (!cloudWritable) {
        logSkip('5-file-limit');
        this.skip();

        return;
      }

      // Fill the account up to the 5-file limit.
      for (let i = 1; i <= 5; i += 1) {
        drawRect();
        saveToCloudAs(`${PREFIX}limit-${i}`);
      }

      openMyCloud();
      cy.get(GRID_CARD).should('have.length', 5);
      cy.get(TAG).invoke('text').should('match', /5\s*\/\s*5/);
      closeMyCloud();

      // Attempt a 6th save -> storage-limit error popup (my_cloud.save_file.storage_limit_exceeded).
      drawRect();
      cy.getMenuItem(['File'], 'Save to Cloud').click();
      cy.contains('.ant-modal', 'Save to Cloud').should('be.visible').as('m6');
      cy.get('@m6').find('input').clear().type(`${PREFIX}limit-6`);
      cy.get('@m6').find('.ant-modal-footer .ant-btn-primary').click();
      cy.waitForProgress();

      cy.contains('.ant-modal', 'cloud storage has reached upper limit').should('be.visible').as('errModal');
      cy.get('@errModal').find('.ant-btn').first().click({ force: true });
      cy.get('@errModal').should('not.exist');

      // Confirm still 5 files (6th was rejected).
      openMyCloud();
      cy.get(GRID_CARD).should('have.length', 5);
      closeMyCloud();
    });
  });
});
