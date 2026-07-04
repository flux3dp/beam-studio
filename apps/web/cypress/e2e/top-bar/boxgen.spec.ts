// Box Generator (Boxgen) is a fully client-side generator: it needs neither
// FLUXGhost nor a machine, so it runs in CI without self-skipping.
//
// Entry point: the left-panel "Generator" tool button (#left-Generator) opens the
// Generators drawer, whose "Box Generator" item opens the Boxgen modal
// (a DraggableModal titled "Box Generator").

const openBoxgen = () => {
  cy.clickToolBtn('Generator', false);
  cy.get('[class*="Generators-module__item"]').contains('Box Generator').click();
  cy.contains('.ant-modal-title', 'Box Generator', { timeout: 10000 }).should('be.visible');
  // Wait for the length inputs (Controller) to be interactive.
  cy.get('input#width').should('be.visible');
};

// Blur helper: antd InputNumber commits/clamps on blur. Clicking the modal title
// blurs the focused input without triggering any control.
const blur = () => cy.contains('.ant-modal-title', 'Box Generator').click();

// Types `value` into a length input and retries until the input settles on
// `expectedDisplay` (the value after antd's min/max clamp, formatted to 2 dp).
// antd re-renders the controlled InputNumber on every keystroke and can drop a
// character on the first interaction, so a single type() is not reliable.
const setLength = (id: 'depth' | 'height' | 'width', value: number, expectedDisplay: string) => {
  const attempt = (retries: number) => {
    cy.get(`input#${id}`).focus().should('be.focused');
    cy.get(`input#${id}`).type('{selectall}');
    cy.get(`input#${id}`).type(String(value));
    blur();
    cy.get(`input#${id}`)
      .invoke('val')
      .then((val) => {
        if (val !== expectedDisplay && retries > 0) attempt(retries - 1);
      });
  };

  attempt(3);
  cy.get(`input#${id}`).should('have.value', expectedDisplay);
};

// Opens the export sub-dialog ("Import"), optionally enables the Label switch,
// confirms the import, and waits for the box layers to land on the canvas.
const importToCanvas = ({ withLabel }: { withLabel: boolean }) => {
  cy.get('.ant-modal button').contains('Continue to Import').click({ force: true });
  cy.contains('.ant-modal-title', 'Import', { timeout: 10000 }).should('be.visible');

  if (withLabel) {
    cy.contains('.ant-modal-title', 'Import')
      .closest('.ant-modal')
      .within(() => {
        cy.contains('.ant-form-item', 'Label').find('.ant-switch').click();
      });
  }

  // The nested Import modal's OK button text is exactly "Import" (the outer Boxgen
  // footer also contains "Continue to Import", hence the exact-text filter).
  cy.contains('.ant-modal-title', 'Import')
    .closest('.ant-modal')
    .within(() => {
      cy.get('.ant-modal-footer button')
        .filter((_, el) => el.textContent?.trim() === 'Import')
        .click({ force: true });
    });

  cy.get('#svgcontent g.layer title', { timeout: 20000 }).should('exist');
};

// Concatenated `d` of every path in the Import preview svg (the one wrapping the
// dashed workarea <rect>), used as a geometry signature. Scoped to the preview
// svg so button icon paths are excluded.
const readPreviewSignature = (alias: string) => {
  cy.get('.ant-modal button').contains('Continue to Import').click({ force: true });
  cy.contains('.ant-modal-title', 'Import', { timeout: 10000 }).should('be.visible');
  cy.contains('.ant-modal-title', 'Import')
    .closest('.ant-modal')
    .find('.ant-modal-body svg')
    .find('path')
    .then(($paths) => {
      cy.wrap([...$paths].map((p) => p.getAttribute('d')).join('|')).as(alias);
    });
  // Close the sub-dialog, returning to the Boxgen modal.
  cy.contains('.ant-modal-title', 'Import')
    .closest('.ant-modal')
    .within(() => {
      cy.get('.ant-modal-footer button')
        .filter((_, el) => el.textContent?.trim() === 'Cancel')
        .click({ force: true });
    });
  cy.contains('.ant-modal-title', 'Box Generator').should('be.visible');
};

const readPreviewPathCount = (onCount: (count: number) => void) => {
  cy.get('.ant-modal button').contains('Continue to Import').click({ force: true });
  cy.contains('.ant-modal-title', 'Import', { timeout: 10000 }).should('be.visible');
  cy.contains('.ant-modal-title', 'Import')
    .closest('.ant-modal')
    .find('.ant-modal-body svg')
    .find('path')
    .its('length')
    .then((n) => onCount(n));
  cy.contains('.ant-modal-title', 'Import')
    .closest('.ant-modal')
    .within(() => {
      cy.get('.ant-modal-footer button')
        .filter((_, el) => el.textContent?.trim() === 'Cancel')
        .click({ force: true });
    });
  cy.contains('.ant-modal-title', 'Box Generator').should('be.visible');
};

describe('box generator', () => {
  beforeEach(() => {
    cy.landingEditor();
    // Deterministic workarea so the width/height/depth limits are known: beamo
    // (fbm1) canvas is 300 x 210 mm -> width max = 300 (long side), height/depth
    // max = 210 (short side), min = 1 for all.
    cy.changeWorkarea('beamo');
    openBoxgen();
  });

  it('accepts in-range values and clamps width/height/depth to min-max limits', () => {
    // In range: accepted as-is (mm, formatted to 2 decimals).
    setLength('width', 150, '150.00');
    setLength('height', 120, '120.00');
    setLength('depth', 90, '90.00');

    // Above max: clamped down. width max = 300 (long side), height/depth max = 210.
    setLength('width', 500, '300.00');
    setLength('height', 999, '210.00');
    setLength('depth', 999, '210.00');

    // Below min (min = 1): clamped up.
    setLength('width', 0, '1.00');
  });

  it('inner vs outer volume toggle changes the exported geometry', () => {
    setLength('width', 100, '100.00');
    setLength('height', 100, '100.00');
    setLength('depth', 100, '100.00');

    cy.get('.ant-radio-button-wrapper').contains('Outer').click();
    readPreviewSignature('outerSig');

    cy.get('.ant-radio-button-wrapper').contains('Inner').click();
    readPreviewSignature('innerSig');

    // Inner inflates every dimension by 2 * sheet thickness, so the emitted path
    // geometry must differ from the outer-dimension export (live-update logic).
    cy.get('@outerSig').then((outer) => {
      cy.get('@innerSig').should((inner) => {
        expect(inner).to.not.eq(outer);
        expect(String(inner).length).to.not.eq(String(outer).length);
      });
    });
  });

  it('cover toggle changes the number of exported panels', () => {
    // A small 40 mm box keeps every panel on a single export page, so the preview
    // path count reflects the full panel set (larger boxes paginate, and the
    // preview shows one page at a time).
    setLength('width', 40, '40.00');
    setLength('height', 40, '40.00');
    setLength('depth', 40, '40.00');

    const counts: { withCover?: number; withoutCover?: number } = {};

    // Cover on (default) -> box has all 6 panels on one page.
    readPreviewPathCount((n) => {
      counts.withCover = n;
    });

    // Cover off -> the Top panel is dropped, so fewer paths are exported.
    cy.contains('.ant-form-item', 'Cover').find('.ant-switch').click();
    cy.contains('.ant-form-item', 'Cover').find('.ant-switch').should('have.attr', 'aria-checked', 'false');
    readPreviewPathCount((n) => {
      counts.withoutCover = n;
    });

    cy.then(() => {
      expect(counts.withoutCover, 'paths without cover').to.be.lessThan(counts.withCover!);
    });
  });

  it('switching joint type reveals joint-specific inputs (edge / finger / t-slot)', () => {
    // Uses the default 80 mm box, where Edge, Finger and T-Slot joints are all
    // enabled. (Resizing the box down first can auto-switch the joint to Edge, so
    // keep the defaults here.)
    const selectJoint = (label: string) => {
      cy.contains('.ant-form-item', 'Joint').find('.ant-select').click();
      // Scope to the currently open dropdown so a stale/previous list isn't hit.
      cy.get('.ant-select-dropdown:visible .ant-select-item-option').contains(label).click({ force: true });
      // Confirm the select reflects the new joint before asserting on the form.
      cy.contains('.ant-form-item', 'Joint').find('.ant-select-selection-item').should('have.text', label);
    };

    // The teeth-length form item (Finger joint, labelled "Finger") toggles via
    // antd's `hidden` prop, as do the T Count / T Diameter / T Length items.
    const fingerItem = () => cy.get('.ant-modal .ant-form-item[class*="Controller-module__teeth-length"]');
    const tCountItem = () => cy.contains('.ant-modal .ant-form-item', 'T Count');

    // Edge: neither the finger teeth-length item nor the t-slot inputs are shown.
    selectJoint('Edge');
    fingerItem().should('not.be.visible');
    tCountItem().should('not.be.visible');

    // Finger: the teeth-length item (with its slider) appears; t-slot stays hidden.
    selectJoint('Finger');
    fingerItem().should('be.visible');
    fingerItem().find('.ant-slider').should('exist');
    tCountItem().should('not.be.visible');

    // T-Slot: T Count / T Diameter / T Length inputs appear; finger item hidden.
    selectJoint('T-Slot');
    tCountItem().should('be.visible');
    cy.contains('.ant-modal .ant-form-item', 'T Diameter').should('be.visible');
    cy.contains('.ant-modal .ant-form-item', 'T Length').should('be.visible');
    fingerItem().should('not.be.visible');
  });

  it('imports box layers to the canvas, adding label layers when enabled', () => {
    setLength('width', 120, '120.00');
    setLength('height', 100, '100.00');
    setLength('depth', 80, '80.00');

    importToCanvas({ withLabel: true });

    // Box shape layers are named "Box 1-N"; label layers "Box 1-N Label".
    cy.get('#svgcontent g.layer').then(($layers) => {
      const titles = [...$layers].map((g) => g.querySelector('title')?.textContent ?? '');

      expect(titles.some((t) => /^Box 1-\d+$/.test(t))).to.eq(true);
      expect(titles.some((t) => /^Box 1-\d+ Label$/.test(t))).to.eq(true);
    });

    // Imported box layers carry real geometry (<use> elements referencing the
    // generated panel symbols), not empty groups.
    cy.get('#svgcontent g.layer')
      .filter((_, el) => /^Box 1-\d+$/.test(el.querySelector('title')?.textContent ?? ''))
      .find('use')
      .its('length')
      .should('be.greaterThan', 0);

    // The layers surface in the right-panel LayerList with matching names.
    cy.showPanel('layers');
    cy.get('div[class*="LayerList-module__item"]').contains('Box 1-1').should('exist');
  });
});
