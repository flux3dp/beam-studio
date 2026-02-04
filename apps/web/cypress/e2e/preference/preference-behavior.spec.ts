import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const laserPanelBlockPrefix = '_-_-packages-core-src-web-app-components-beambox-RightPanel-ConfigPanel-Block-module__';

function drawingEllipse() {
  cy.clickToolBtn('Ellipse');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
}

describe('update the preference (behavior)', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('change guide setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    // Switch - click to toggle on
    cy.get('#set-guide').click();
    cy.get('#set-guide').should('have.attr', 'aria-checked', 'true');

    cy.get('#set-guide-axis-x').clear({ force: true }).type('10').blur();
    cy.get('#set-guide-axis-y').clear({ force: true }).type('10').blur();
    cy.applySettings();
    cy.get('#horizontal_guide').should('exist').should('have.attr', 'x1', '0').should('have.attr', 'y1', '100');
    cy.get('#vertical_guide').should('exist').should('have.attr', 'x1', '100').should('have.attr', 'y1', '0');
  });

  it('change bitmap preview quality setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');

    cy.get('#set-bitmap-quality').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Normal').click({ force: true });
    cy.applySettings();

    cy.uploadImage('flux.png');
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('89c7aa6cb93a4fd9f6e79c9da0e5ade2');
        else expect(md5(href)).equal('0563e97e7042d4030269ceb3c82f3ab8');
      });
  });

  it('change anti aliasing setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    // Switch - anti-aliasing defaults to true, so we verify it's on
    cy.get('#set-anti-aliasing').should('have.attr', 'aria-checked', 'true');
    cy.applySettings();
    drawingEllipse();
    cy.get('svg#svgcontent').should(($shapeRendering) => {
      let str = $shapeRendering.attr('style');
      expect(str.substring(50)).equal('');
    });
  });

  it('change continuous drawing setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    // Switch - click to toggle on
    cy.get('#set-continuous-drawing').click();
    cy.get('#set-continuous-drawing').should('have.attr', 'aria-checked', 'true');
    cy.applySettings();

    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.checkToolBtnActive('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 150, 150, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 250, 250, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    cy.get('#svg_2').should('exist');
  });

  it('remove speed limit and see if home page gets changed ', () => {
    drawingEllipse();
    cy.get('.layers > .tab-icon').click();
    cy.get('#speed div.ant-slider-handle').trigger('mousedown');
    cy.get('#speed div.ant-slider-handle').trigger('mousemove', 200, 0, {
      force: true,
    });
    cy.get('#speed div.ant-slider-handle').trigger('mouseup');
    cy.get(`[class*="${laserPanelBlockPrefix}warning-icon"]`).should('exist');
    cy.get(`[class*="${laserPanelBlockPrefix}warning-text"]`).should(
      'have.text',
      'The cutting speed of vector path objects will be constrained to 20 mm/s. You can remove this limit at Preferences Settings.',
    );
    cy.go2Preference();
    cy.goToSettingsCategory('Vector');

    // Switch - click to toggle off
    cy.get('#set-vector-speed-constraint').click();
    cy.get('#set-vector-speed-constraint').should('have.attr', 'aria-checked', 'false');
    cy.applySettings();
    drawingEllipse();
    cy.get('.layers > .tab-icon').click();
    cy.get('#speed div.ant-slider-handle').trigger('mousedown');
    cy.get('#speed div.ant-slider-handle').trigger('mousemove', 200, 0, {
      force: true,
    });
    cy.get('#speed div.ant-slider-handle').trigger('mouseup');
    cy.get(`[class*="${laserPanelBlockPrefix}warning-icon"]`).should('not.exist');
    cy.get(`[class*="${laserPanelBlockPrefix}warning-text"]`).should('not.exist');
  });
});
