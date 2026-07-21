// Release-test rows: UV Ink / 白底 (White Base) / 雙面列印 (Two-sided Print).
//
// Reality of the web build (verified against packages/core/src/web on 2026-07):
//   * "White Base" (白底) is implemented as the White Ink toggle (`wInk` layer config,
//     `.white-ink-checkbox`). It only renders in dev mode on a full-color printing layer
//     (ConfigPanel.tsx: `isDevMode && isPrinting && fullcolor.value`). This spec covers it.
//   * "UV Ink" is NOT an ink-type selector on Ador. UV printing is a separate dev-gated
//     module (`UV_PRINT`) / a different machine (Miro UV / fuv1). There is no UV-driven
//     30 mm/s speed cap in the config panel. The only module speed cap in SpeedBlock is
//     `PRINTER_4C -> 45`, and PRINTER_4C is not an Ador printing module. So the "assert the
//     speed max is capped for UV" case has no observable UI to assert against on Ador and is
//     DROPPED. We instead cover the closest real, machine-free assertion: the printing-layer
//     speed control exposes the expected discrete simple-mode options / numeric max.
//   * "Two-sided Print" (雙面列印) does NOT exist anywhere in the web codebase (no
//     twoSided/two_sided/雙面 source, no forcing-of-white-base logic). DROPPED.
//
// See the returned report for the exact source references.

const openWhiteInkEnabledPrintingLayer = () => {
  // Enable dev mode so the White Ink (White Base) checkbox renders, then land the editor.
  cy.landingEditor({
    onBeforeLoad(win) {
      win.localStorage.setItem('dev', 'true');
    },
  });
  cy.changeWorkarea('Ador');
  // Convert the default 20W laser layer into a full-color Printing layer.
  cy.get('.ant-select-selection-item').contains('20W Diode Laser').click();
  cy.get('.ant-select-item-option-content').contains('Printing').click();
  cy.get('.ant-btn').contains('Confirm').click();
  cy.get('#presprayAreaImage').should('be.visible');
};

describe('printing toggles', () => {
  it('White Base (White Ink): toggle persists to layer config and reveals settings', () => {
    openWhiteInkEnabledPrintingLayer();

    // Select the printing layer so the toggle writes to its config.
    cy.showPanel('layers');
    cy.get('#layerdoubleclick-0').click();

    // Default: disabled (wInk stored negative), checkbox unchecked, no settings icon.
    // NB: config attributes live on the SVG layer <g>, whose attribute names are
    // case-sensitive, so the White Ink attribute is `data-wInk` (not `data-wink`).
    cy.get('.white-ink-checkbox').should('exist').find('input').should('not.be.checked');
    cy.get('g.layer')
      .invoke('attr', 'data-wInk')
      .then((v) => expect(Number(v)).to.be.lessThan(0));

    // Toggle on -> checkbox checked, layer config flips positive, settings icon appears.
    cy.get('.white-ink-checkbox').click();
    cy.get('.white-ink-checkbox').find('input').should('be.checked');
    cy.get('g.layer')
      .invoke('attr', 'data-wInk')
      .then((v) => expect(Number(v)).to.be.greaterThan(0));

    // The White Ink settings modal is reachable while enabled.
    cy.get('.white-ink-checkbox')
      .parent()
      .find('[class*="WhiteInkCheckbox-module__setting"]')
      .should('exist')
      .click();
    cy.get('.ant-modal-title').should('have.text', 'White Ink Settings');
    cy.get('.ant-modal .ant-btn').contains('Cancel').click();
    cy.get('.ant-modal-title').should('not.exist');

    // Toggle off -> unchecked, settings icon gone, layer config back to a negative value.
    cy.get('.white-ink-checkbox').click();
    cy.get('.white-ink-checkbox').find('input').should('not.be.checked');
    cy.get('.white-ink-checkbox').parent().find('[class*="WhiteInkCheckbox-module__setting"]').should('not.exist');
    cy.get('g.layer')
      .invoke('attr', 'data-wInk')
      .then((v) => expect(Number(v)).to.be.lessThan(0));
  });

  it('printing-layer speed control is the discrete simple-mode slider (UV-ink cap N/A on Ador)', () => {
    // Machine-free stand-in for the dropped "UV ink -> 30 mm/s cap" case:
    // On an Ador printing layer in simple mode (print-advanced-mode off by default), the speed
    // control is an index-based slider over the discrete getSpeedOptions(PRINTER) presets
    // (10/30/60/100/150), NOT a raw 0..maxSpeed(400) slider. Assert the slider handle's
    // aria-valuemax reflects the option-index range (small integer) rather than the raw max.
    openWhiteInkEnabledPrintingLayer();

    cy.get('#speed').should('exist');
    cy.get('#speed .ant-slider-handle')
      .invoke('attr', 'aria-valuemax')
      .then((v) => {
        // 5 discrete PRINTER presets -> index range 0..4 (may be +1 when the current value is
        // injected as an extra option). Either way it is far below the raw 400 mm/s max.
        expect(Number(v)).to.be.lessThan(20);
      });
  });
});
