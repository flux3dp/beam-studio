const laserPanelBlockPrefix = '_-_-packages-core-src-web-app-components-beambox-RightPanel-ConfigPanel-Block-module__';
const warningIconSelector = `[class*="${laserPanelBlockPrefix}warning-icon"]`;
const warningTextSelector = `[class*="${laserPanelBlockPrefix}warning-text"]`;

function drawRect() {
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  cy.clickToolBtn('Cursor');
}

function setSpeed(value: number) {
  cy.get('#speed-input').clear({ force: true }).type(`${value}`, { force: true }).blur();
}

describe('speed limit warning', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('shows warning when layer speed exceeds the vector speed limit', () => {
    drawRect();
    cy.showPanel('layers');

    // Default workarea (Beambox) vector speed limit is 20 mm/s.
    setSpeed(150);
    cy.get(warningIconSelector).should('exist');
    cy.get(warningTextSelector).should(
      'have.text',
      'The cutting speed of vector path objects will be constrained to 20 mm/s. You can remove this limit at Preferences Settings.',
    );
  });

  it('hides warning when speed is lowered below the vector speed limit', () => {
    drawRect();
    cy.showPanel('layers');

    setSpeed(150);
    cy.get(warningIconSelector).should('exist');

    // Lower the speed below the 20 mm/s limit -> warning disappears.
    setSpeed(10);
    cy.get(warningIconSelector).should('not.exist');
    cy.get(warningTextSelector).should('not.exist');
  });

  it('shows no warning for an image-only layer even at high speed', () => {
    // An uploaded bitmap is not a vector path, so hasVector is false and no
    // vector speed constraint applies regardless of the layer speed.
    cy.uploadImage('flux.png');
    cy.showPanel('layers');

    setSpeed(150);
    cy.get(warningIconSelector).should('not.exist');
    cy.get(warningTextSelector).should('not.exist');
  });

  it('uses the Beambox II (fbb2) 50 mm/s threshold instead of the default 20 mm/s', () => {
    cy.changeWorkarea('Beambox II');
    drawRect();
    cy.showPanel('layers');

    // 40 mm/s is above the default 20 mm/s limit but below Beambox II's 50 mm/s
    // limit, so no warning should appear on this workarea.
    setSpeed(40);
    cy.get(warningIconSelector).should('not.exist');
    cy.get(warningTextSelector).should('not.exist');

    // 100 mm/s exceeds the 50 mm/s limit -> warning appears with the raised threshold.
    setSpeed(100);
    cy.get(warningIconSelector).should('exist');
    cy.get(warningTextSelector).should(
      'have.text',
      'The cutting speed of vector path objects will be constrained to 50 mm/s. You can remove this limit at Preferences Settings.',
    );
  });
});
