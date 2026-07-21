// Covers the config-panel low-power hint (release-test power-hint rows) and the
// dimension/position Enter-commit behaviour (release-test dimension-input row).
//
// The PowerBlock hint reuses the shared Block.module.scss warning-icon/warning-text
// classes, so the selectors match the speed-limit-warning spec.
const laserPanelBlockPrefix = '_-_-packages-core-src-web-app-components-beambox-RightPanel-ConfigPanel-Block-module__';
const warningIconSelector = `[class*="${laserPanelBlockPrefix}warning-icon"]`;
const warningTextSelector = `[class*="${laserPanelBlockPrefix}warning-text"]`;

// packages/core en.ts -> beambox.right_panel.laser_panel.low_power_warning
const lowPowerText = 'Lower laser power (under 10%) might not emit the laser light.';

function drawRect() {
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.clickToolBtn('Cursor');
}

function setPower(value: number) {
  cy.get('#power-input').clear({ force: true }).type(`${value}`, { force: true }).blur();
}

describe('config panel warnings', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('shows the low-power hint when layer power is below 10% and hides it when raised', () => {
    drawRect();
    cy.showPanel('layers');

    // Default workarea (Beambox / fbb1b) has minPower 10, so power < 10% triggers the hint.
    setPower(5);
    cy.get(warningIconSelector).should('exist');
    cy.get(warningTextSelector).should('have.text', lowPowerText);

    // Raising power to/above the 10% threshold hides the hint.
    setPower(50);
    cy.get(warningIconSelector).should('not.exist');
    cy.get(warningTextSelector).should('not.exist');
  });

  it('does not show the low-power hint on Beambox II (fbb2 has no minPower)', () => {
    cy.changeWorkarea('Beambox II');
    drawRect();
    cy.showPanel('layers');

    // fbb2 defines no minPower, so `power.value < (minPower ?? -1)` is never true:
    // even at 1% the hint must not appear.
    setPower(1);
    cy.get(warningIconSelector).should('not.exist');
    cy.get(warningTextSelector).should('not.exist');
  });

  it('commits a new width on Enter and updates the SVG element attribute', () => {
    drawRect();
    cy.get('#svg_1').should('exist').click({ force: true });
    cy.showPanel('objects');

    // 100 mm * 10 dpmm = 1000 px on the rect's width attribute.
    cy.get('#w_size').type('{selectall}{backspace}100{enter}');
    cy.inputValueCloseTo('#w_size', 100, 0.01);
    cy.get('#svg_1').should('have.attr', 'width', '1000');

    // Value persists across deselect + reselect.
    cy.get('svg#svgcontent').trigger('mousedown', 700, 700, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').click({ force: true });
    cy.showPanel('objects');
    cy.inputValueCloseTo('#w_size', 100, 0.01);
    cy.get('#svg_1').should('have.attr', 'width', '1000');
  });

  it('commits a new X position on Enter and updates the SVG element attribute', () => {
    drawRect();
    cy.get('#svg_1').should('exist').click({ force: true });
    cy.showPanel('objects');

    // 80 mm * 10 dpmm = 800 px on the rect's x attribute.
    cy.get('#x_position').type('{selectall}{backspace}80{enter}');
    cy.inputValueCloseTo('#x_position', 80, 0.01);
    cy.get('#svg_1').should('have.attr', 'x', '800');

    // Value persists across deselect + reselect.
    cy.get('svg#svgcontent').trigger('mousedown', 20, 20, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').click({ force: true });
    cy.showPanel('objects');
    cy.inputValueCloseTo('#x_position', 80, 0.01);
    cy.get('#svg_1').should('have.attr', 'x', '800');
  });
});
