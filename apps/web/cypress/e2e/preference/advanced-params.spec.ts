// Release-test coverage:
//   - 列印參數進階設定 (print advanced parameters): the print-param range/limit toggles that
//     live in Preferences. In the web build these are the Editor-category switches
//     `print-advanced-mode` (基礎/進階 range) and `enable-uv-print-file` (UV print export),
//     plus the Vector-category `vector_speed_constraint` (the vector-path speed limit).
//     There are no separate per-channel "UV speed limit / SV speed limit / saturation limit"
//     preference switches in the codebase — all print-param limiting is governed by the single
//     `print-advanced-mode` preference (advanced mode removes the preset-only slider limits).
//     We assert each toggle persists across Apply + reopen. The downstream config-panel slider
//     behaviour these drive requires a printer-module layer and is exercised by human release
//     checks, so persistence assertions stand in here (per the e2e-test skill guidance).
//   - 混合雷射預設 (hybrid-laser default): "混合雷射" maps to the beamo diode module. Its default
//     is asserted from a fresh editor (`default-diode` === OFF, id `#default-diode` under the
//     Add-on / Module category, which defaults to the beamo module view).
//   - 混合雷射偏移值 (hybrid-laser offset defaults): the diode offset inputs default to X=70, Y=7
//     (constant.diode.defaultOffsetX / defaultOffsetY), matching the sheet's 預設往右70mm，往上7mm.
//   - FLUX ID 註冊外連 (FLUX ID register external link): the "Create Your FLUX Account" button in
//     the login dialog calls browser.open(signup_url). On web browser.open delegates to
//     window.open, so we stub window.open and assert it is called with the signup URL.
//     Source of truth: lang/en.ts -> topbar.menu.signup_url === 'https://id.flux3dp.com/user/login#up'.

const FLUX_ID_SIGNUP_URL = 'https://id.flux3dp.com/user/login#up';

describe('advanced params preferences', () => {
  it('persists the print-advanced-mode and UV print-file toggles', () => {
    cy.landingEditor();

    cy.go2Preference();
    cy.goToSettingsCategory('Editor');

    // Both default to OFF; toggle them ON.
    cy.get('#print-advanced-mode').should('have.attr', 'aria-checked', 'false').click();
    cy.get('#print-advanced-mode').should('have.attr', 'aria-checked', 'true');
    cy.get('#set-enable-uv-print-file').should('have.attr', 'aria-checked', 'false').click();
    cy.get('#set-enable-uv-print-file').should('have.attr', 'aria-checked', 'true');
    cy.applySettings();

    // Reopen and confirm both persisted ON.
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    cy.get('#print-advanced-mode').should('have.attr', 'aria-checked', 'true');
    cy.get('#set-enable-uv-print-file').should('have.attr', 'aria-checked', 'true');

    // Toggle both back OFF and confirm that persists too.
    cy.get('#print-advanced-mode').click().should('have.attr', 'aria-checked', 'false');
    cy.get('#set-enable-uv-print-file').click().should('have.attr', 'aria-checked', 'false');
    cy.applySettings();

    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    cy.get('#print-advanced-mode').should('have.attr', 'aria-checked', 'false');
    cy.get('#set-enable-uv-print-file').should('have.attr', 'aria-checked', 'false');
  });

  it('persists the vector-path speed limit toggle', () => {
    cy.landingEditor();

    cy.go2Preference();
    cy.goToSettingsCategory('Vector');

    // Defaults ON; toggle OFF (removes the 20 mm/s constraint) and assert it persists.
    cy.get('#set-vector-speed-constraint').should('have.attr', 'aria-checked', 'true').click();
    cy.get('#set-vector-speed-constraint').should('have.attr', 'aria-checked', 'false');
    cy.applySettings();

    cy.go2Preference();
    cy.goToSettingsCategory('Vector');
    cy.get('#set-vector-speed-constraint').should('have.attr', 'aria-checked', 'false');

    // Toggle back ON and confirm.
    cy.get('#set-vector-speed-constraint').click().should('have.attr', 'aria-checked', 'true');
    cy.applySettings();

    cy.go2Preference();
    cy.goToSettingsCategory('Vector');
    cy.get('#set-vector-speed-constraint').should('have.attr', 'aria-checked', 'true');
  });

  it('defaults hybrid-laser (diode) module to OFF with 70mm/7mm offsets', () => {
    cy.landingEditor();

    cy.go2Preference();
    // "混合雷射" = beamo diode module; its settings live under the Add-on (Module) category,
    // which renders the beamo module view by default.
    cy.goToSettingsCategory('Add-on');

    // Hybrid-laser default: OFF.
    cy.get('#default-diode').should('have.attr', 'aria-checked', 'false');

    // Offset defaults: X (right) = 70mm, Y (up) = 7mm.
    cy.inputValueCloseTo('#set_diode_offset-x', 70, 0.1);
    cy.inputValueCloseTo('#set_diode_offset-y', 7, 0.1);
  });

  it('opens the FLUX ID signup page from the login dialog register button', () => {
    cy.landingEditor({
      onBeforeLoad(win) {
        // Stub before the app loads so browser.open() -> window.open() hits the stub.
        cy.stub(win, 'open').as('windowOpen');
      },
    });

    // Account menu -> "Log in or Sign Up" opens the FLUX ID login dialog.
    cy.getMenuItem(['Account'], 'Log in or Sign Up').click();

    // The dialog's register button opens the FLUX ID signup page in a new tab.
    cy.get('.ant-modal-content').contains('button', 'Create Your FLUX Account').click();

    cy.get('@windowOpen').should('have.been.calledWith', FLUX_ID_SIGNUP_URL);
  });
});
