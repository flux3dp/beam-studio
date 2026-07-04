// Material Test Generator is a client-side generator: it does not need FLUXGhost
// or a machine, so it runs in CI without self-skipping.
//
// Entry point: left-panel "Generator" tool button (#left-Generator) opens the
// Generators drawer, whose "Material Test Generator" item opens the generator modal.
//
// Layout of what the generator emits into #svgcontent:
//   - One "engrave"/"cut" rect per block, each in its own layer named "P{strength}-S{speed}"
//     (column param = strength -> "P", row param = speed -> "S"). Number of block layers =
//     columns.count * rows.count.
//   - A "Material Test - Frame" layer with a single rounded rect (the outer frame).
//   - A "Material Test - Info" layer holding the axis title texts plus one label per row and
//     per column: 2 (axis titles) + rows.count + columns.count <text> elements.
// Layer names live in each g.layer's <title>; per-layer laser params live on the group as
// data-strength / data-speed / data-repeat attributes.

const openGenerator = () => {
  // Deterministic workarea so the table speed max is known and stable.
  cy.changeWorkarea('beamo');
  cy.clickToolBtn('Generator', false);
  cy.get('[class*="Generators-module__item"]').contains('Material Test Generator').click();
  // Modal from DraggableModal; title comes from lang.material_test_generator.title.
  cy.get('.ant-modal-content').should('be.visible').contains('.ant-modal-title', 'Material Test Generator');
};

// antd UnitInput (InputNumber) renders data-testid directly on the <input>; it clamps to
// min/max on blur/enter. Select-all before typing so the previous value is fully replaced
// (a plain clear() can race with antd's controlled value and leave the old digits in place).
const setByTestId = (testid: string, value: number) => {
  cy.get(`input[data-testid="${testid}"]`).as('unitInput');
  // {enter} commits and clamps the antd InputNumber (and moves focus away), so no blur needed.
  cy.get('@unitInput').type(`{selectall}${value}{enter}`);
  cy.get('@unitInput').should('have.value', `${value}`);
};

// Count block layers = every g.layer whose <title> matches the block naming "P<n>-S<n>".
const blockLayerTitles = () =>
  cy.get('#svgcontent g.layer title').then(($titles) =>
    Cypress._.filter(
      Array.from($titles).map((t) => t.textContent || ''),
      (name) => /^P\d+-S\d+$/.test(name),
    ),
  );

describe('material test generator', () => {
  beforeEach(() => {
    cy.landingEditor();
    openGenerator();
  });

  it('updates the block/text preview when row and column counts change', () => {
    // Shrink to a small deterministic grid: 3 columns x 2 rows -> 6 blocks.
    setByTestId('column-count', 3);
    setByTestId('row-count', 2);

    // The preview re-runs on every setting change (useEffect -> handlePreview).
    // 6 block layers named "P<strength>-S<speed>".
    blockLayerTitles().should('have.length', 6);

    // Frame + Info layers exist.
    cy.get('#svgcontent g.layer title')
      .then(($t) => Array.from($t).map((n) => n.textContent))
      .should('include', 'Material Test - Frame')
      .and('include', 'Material Test - Info');

    // Info layer text labels: 2 axis titles + columns.count(3) + rows.count(2) = 7.
    cy.get('#svgcontent g.layer')
      .filter((_i, el) => el.querySelector('title')?.textContent === 'Material Test - Info')
      .find('text')
      .should('have.length', 7);

    // A single framing rect in the Frame layer.
    cy.get('#svgcontent g.layer')
      .filter((_i, el) => el.querySelector('title')?.textContent === 'Material Test - Frame')
      .find('rect')
      .should('have.length', 1);

    // Change counts again -> preview updates to the new grid (2 columns x 4 rows -> 8 blocks).
    setByTestId('column-count', 2);
    setByTestId('row-count', 4);
    blockLayerTitles().should('have.length', 8);
    cy.get('#svgcontent g.layer')
      .filter((_i, el) => el.querySelector('title')?.textContent === 'Material Test - Info')
      .find('text')
      .should('have.length', 2 + 2 + 4);
  });

  it('exports the generated grid, its labels and layers onto the canvas', () => {
    setByTestId('column-count', 3);
    setByTestId('row-count', 3);

    // Confirm/export -> the batch command is committed and the modal closes.
    cy.get('.ant-modal-footer button, .ant-modal button').contains('Export').click();
    cy.get('.ant-modal-content').should('not.exist');

    // 9 engraved/cut block rects landed as their own layers named "P<n>-S<n>".
    blockLayerTitles().should('have.length', 9);

    // Each block layer carries the per-layer laser params written by writeDataLayer.
    cy.get('#svgcontent g.layer')
      .filter((_i, el) => /^P\d+-S\d+$/.test(el.querySelector('title')?.textContent || ''))
      .each(($layer) => {
        // Only assert the swept axes (strength = column, speed = row). Static params such as
        // repeat/frequency are intentionally not asserted per-block here.
        cy.wrap($layer).should('have.attr', 'data-strength');
        cy.wrap($layer).should('have.attr', 'data-speed');
        // Exactly one block rect per block layer.
        cy.wrap($layer).find('rect').should('have.length', 1);
      });

    // Frame + Info layers persisted after export.
    cy.get('#svgcontent g.layer title')
      .then(($t) => Array.from($t).map((n) => n.textContent))
      .should('include', 'Material Test - Frame')
      .and('include', 'Material Test - Info');

    // Info axis + tick labels: 2 + columns.count(3) + rows.count(3) = 8 texts.
    cy.get('#svgcontent g.layer')
      .filter((_i, el) => el.querySelector('title')?.textContent === 'Material Test - Info')
      .find('text')
      .should('have.length', 8);

    // Layers show up in the right-panel LayerList.
    cy.showPanel('layers');
    cy.get('div[class*="LayerList-module"]').contains('Material Test - Frame').should('exist');
  });

  it('changing the speed/strength range changes the generated per-layer params', () => {
    // Deterministic small grid so the min/max endpoints are the extreme blocks.
    setByTestId('column-count', 2); // strength axis (columns)
    setByTestId('row-count', 2); // speed axis (rows)

    // Widen the ranges: strength 40..80 (%), speed 50..150 (mm/s).
    setByTestId('min-strength', 40);
    setByTestId('max-strength', 80);
    setByTestId('min-speed', 50);
    setByTestId('max-speed', 150);

    cy.get('.ant-modal-footer button, .ant-modal button').contains('Export').click();
    cy.get('.ant-modal-content').should('not.exist');

    // Collect the strength/speed values that actually landed on the block layers.
    cy.get('#svgcontent g.layer')
      .filter((_i, el) => /^P\d+-S\d+$/.test(el.querySelector('title')?.textContent || ''))
      .then(($layers) => {
        const strengths = Array.from($layers).map((l) => Number(l.getAttribute('data-strength')));
        const speeds = Array.from($layers).map((l) => Number(l.getAttribute('data-speed')));

        // Endpoints of the swept ranges must appear on the generated layers.
        expect(Cypress._.min(strengths)).to.eq(40);
        expect(Cypress._.max(strengths)).to.eq(80);
        expect(Cypress._.min(speeds)).to.eq(50);
        expect(Cypress._.max(speeds)).to.eq(150);

        // Every generated strength/speed sits within the requested range.
        strengths.forEach((s) => expect(s).to.be.within(40, 80));
        speeds.forEach((s) => expect(s).to.be.within(50, 150));
      });
  });
});
