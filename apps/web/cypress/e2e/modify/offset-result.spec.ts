// Result-correctness coverage for the Offset tool (release-test sheet: 位移複製結果是否正確).
// Complements offset-tools.spec.ts (basic flow) by asserting the offset result's
// bounding-box size grows/shrinks by exactly 2×distance for vector/closed-path/text,
// that compound (concentric) outward offset follows only the outer outline, and it
// documents the actual behavior of offset on a bitmap image.
//
// Offset is fully client-side (clipper) — no FLUXGhost/machine, so this runs in CI too.

/** Read a numeric UnitInput/input value and return it as a float. */
const readSize = (selector: string): Cypress.Chainable<number> =>
  cy
    .get(selector)
    .invoke('val')
    .then((val) => parseFloat(val as string));

/** Draw a rectangle on the canvas by dragging between two screen points. Leaves it selected. */
const drawRect = (x1: number, y1: number, x2: number, y2: number, id = '#svg_1') => {
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', x1, y1, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', x2, y2, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.getElementTitle().should('have.text', 'Layer 1 > Rectangle');
  // Switching to Cursor drops the selection; re-select the shape so the dimension panel shows.
  cy.clickToolBtn('Cursor');
  cy.get(id).click({ force: true });
  cy.getElementTitle().should('have.text', 'Layer 1 > Rectangle');
};

/** Draw an ellipse (title reads "Oval"). Leaves it selected. */
const drawEllipse = (x1: number, y1: number, x2: number, y2: number) => {
  cy.clickToolBtn('Ellipse');
  cy.get('svg#svgcontent').trigger('mousedown', x1, y1, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', x2, y2, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.getElementTitle().should('have.text', 'Layer 1 > Oval');
  // Switching to Cursor drops the selection; rubber-band re-select (unfilled oval has no
  // clickable interior) so the dimension panel shows.
  cy.clickToolBtn('Cursor');
  cy.get('svg#svgcontent').trigger('mousedown', x1 - 20, y1 - 20, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', x2 + 20, y2 + 20, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.getElementTitle().should('have.text', 'Layer 1 > Oval');
};

/**
 * Open the offset dialog, set direction + distance, confirm, and wait for it to close.
 * Assumes the target element(s) are already selected and the objects panel is shown.
 */
const runOffset = (direction: 'inward' | 'outward', distance: number) => {
  cy.get('#offset').click();
  cy.findByTestId('offset-distance').should('be.visible').and('not.be.disabled');

  // Direction Select has no testid — locate it by the field whose label is "Offset Direction".
  const label = direction === 'outward' ? 'Outward' : 'Inward';

  cy.contains('span', 'Offset Direction')
    .parent()
    .find('.ant-select')
    .click();
  cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .find('.ant-select-item-option')
    .contains(label)
    .click();

  cy.findByTestId('offset-distance').clear({ force: true }).type(`${distance}`, { force: true }).blur();
  cy.findAllByText('Confirm').click();
  cy.findByTestId('offset-distance').should('not.exist');
};

describe('offset result correctness', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('vector rect: outward grows and inward shrinks by 2×distance', () => {
    // --- outward distance 5 ---
    drawRect(100, 100, 300, 300);
    cy.showPanel('objects');

    let srcW = 0;
    let srcH = 0;

    readSize('#w_size').then((w) => (srcW = w));
    readSize('#h_size').then((h) => (srcH = h));

    runOffset('outward', 5);

    // Offset result is auto-selected; its size should be source + 2×distance.
    cy.then(() => {
      cy.inputValueCloseTo('#w_size', srcW + 10, 0.3);
      cy.inputValueCloseTo('#h_size', srcH + 10, 0.3);
    });

    // --- outward distance 10 on a fresh rect ---
    cy.landingEditor();
    drawRect(100, 100, 300, 300);
    cy.showPanel('objects');
    readSize('#w_size').then((w) => (srcW = w));
    readSize('#h_size').then((h) => (srcH = h));

    runOffset('outward', 10);

    cy.then(() => {
      cy.inputValueCloseTo('#w_size', srcW + 20, 0.4);
      cy.inputValueCloseTo('#h_size', srcH + 20, 0.4);
    });

    // --- inward distance 5 shrinks by 2×distance ---
    cy.landingEditor();
    drawRect(100, 100, 300, 300);
    cy.showPanel('objects');
    readSize('#w_size').then((w) => (srcW = w));
    readSize('#h_size').then((h) => (srcH = h));

    runOffset('inward', 5);

    cy.then(() => {
      cy.inputValueCloseTo('#w_size', srcW - 10, 0.3);
      cy.inputValueCloseTo('#h_size', srcH - 10, 0.3);
    });
  });

  it('closed path (ellipse): outward grows and inward shrinks by 2×distance', () => {
    // An ellipse's dimension panel exposes rx/ry (#rx_size/#ry_size), not w/h — and those
    // fields display the full width/height (diameter), not the radius. After offset the
    // result is a path, whose panel exposes #w_size/#h_size, so we compare result w/h
    // against the source rx/ry values.
    drawEllipse(100, 100, 300, 260);
    cy.showPanel('objects');

    let srcW = 0;
    let srcH = 0;

    readSize('#rx_size').then((rx) => (srcW = rx));
    readSize('#ry_size').then((ry) => (srcH = ry));

    runOffset('outward', 8);

    cy.then(() => {
      cy.inputValueCloseTo('#w_size', srcW + 16, 0.5);
      cy.inputValueCloseTo('#h_size', srcH + 16, 0.5);
    });

    // inward on a fresh ellipse
    cy.landingEditor();
    drawEllipse(100, 100, 300, 260);
    cy.showPanel('objects');
    readSize('#rx_size').then((rx) => (srcW = rx));
    readSize('#ry_size').then((ry) => (srcH = ry));

    runOffset('inward', 5);

    cy.then(() => {
      cy.inputValueCloseTo('#w_size', srcW - 10, 0.5);
      cy.inputValueCloseTo('#h_size', srcH - 10, 0.5);
    });
  });

  it('text: outward offset creates a result path that grows with distance', () => {
    // Text offset converts glyphs to paths first, so the ink bbox differs from the text
    // element's reported bbox. The robust result-correctness check is that a result path
    // is created and that a larger offset distance yields a strictly larger bbox.
    // NOTE: no md5/path checksum here — glyph paths differ per platform.
    const createBedfortText = () => {
      cy.clickToolBtn('Text');
      cy.get('svg#svgcontent').realClick({ x: 150, y: 150 });
      cy.get('#svg_1').should('exist');
      cy.inputText('AB');
      cy.getElementTitle().should('have.text', 'Layer 1 > Text');
      cy.showPanel('objects');
      cy.get('div#object-panel').should('exist');
      cy.get('.ant-select-selection-item[title="Font"]').click();
      cy.get('.ant-select-item-option-content img[alt="Mr Bedfort"]').click();
      cy.get('#svg_1').should('have.attr', 'font-family').and('eq', "'Mr Bedfort'");
      cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').should('not.exist');
    };

    let smallW = 0;
    let smallH = 0;

    // Smaller outward offset.
    createBedfortText();
    runOffset('outward', 2);
    cy.get('#svgcontent path').should('exist');
    readSize('#w_size').then((w) => (smallW = w));
    readSize('#h_size').then((h) => (smallH = h));

    // Larger outward offset on identical text → strictly larger bbox.
    cy.landingEditor();
    createBedfortText();
    runOffset('outward', 6);
    cy.get('#svgcontent path').should('exist');
    cy.then(() => {
      cy.get('#w_size')
        .invoke('val')
        .then((val) => expect(parseFloat(val as string)).to.be.greaterThan(smallW));
      cy.get('#h_size')
        .invoke('val')
        .then((val) => expect(parseFloat(val as string)).to.be.greaterThan(smallH));
    });
  });

  it('compound (concentric rects): outward offset follows only the outer outline', () => {
    // Outer rect (larger)
    drawRect(80, 80, 320, 320);
    cy.showPanel('objects');

    let outerW = 0;
    let outerH = 0;

    readSize('#w_size').then((w) => (outerW = w));
    readSize('#h_size').then((h) => (outerH = h));

    // Inner rect (smaller, concentric-ish, fully inside the outer)
    drawRect(160, 160, 240, 240, '#svg_2');

    // Multi-select both rects
    cy.clickToolBtn('Cursor');
    cy.get('svg#svgcontent').trigger('mousedown', 40, 40, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 360, 360, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.findAllByText('Multiple Objects').should('exist');
    cy.showPanel('objects');

    runOffset('outward', 5);

    // The unioned offset result should track the OUTER outline (+2×distance),
    // not the inner rect. Assert result size ≈ outer + 10, clearly larger than inner (~40mm).
    cy.then(() => {
      cy.inputValueCloseTo('#w_size', outerW + 10, 0.4);
      cy.inputValueCloseTo('#h_size', outerH + 10, 0.4);
    });
  });

  it('bitmap image: offset is enabled and produces a rect-based offset', () => {
    // The sheet lists 點陣圖. The #offset button IS rendered for images; offsetting an
    // image converts its bounding rect to a path and offsets that. Assert the button is
    // enabled and the outward offset result is the image bbox + 2×distance.
    cy.uploadImage('flux.png');
    cy.get('#svg_1').click({ force: true });
    cy.showPanel('objects');

    cy.get('#offset').should('exist').and('not.have.class', 'disabled');

    let srcW = 0;
    let srcH = 0;

    readSize('#w_size').then((w) => (srcW = w));
    readSize('#h_size').then((h) => (srcH = h));

    runOffset('outward', 5);

    cy.get('#svgcontent path').should('exist');
    cy.then(() => {
      cy.inputValueCloseTo('#w_size', srcW + 10, 0.5);
      cy.inputValueCloseTo('#h_size', srcH + 10, 0.5);
    });
  });
});
