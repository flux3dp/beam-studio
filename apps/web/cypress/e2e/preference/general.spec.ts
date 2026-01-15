import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const laserPanelBlockPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-ConfigPanel-Block-module__';

function drawingEllipse() {
  cy.clickToolBtn('Ellipse');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
}

function applySettings() {
  cy.get('div.btn-done').click();
  cy.window().its('svgCanvas', { timeout: 5000 });
}

describe('update the preference', () => {
  const { baseUrl } = Cypress.config();
  beforeEach(() => {
    cy.landingEditor();
  });

  it('check default value with preference page', () => {
    cy.go2Preference();
    cy.get('#select-lang').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'English');

    // Switches - check aria-checked attribute (Ant Design Switch)
    cy.get('#set-guessing-poke').should('have.attr', 'aria-checked', 'true');

    cy.get('#set-auto-connect').should('have.attr', 'aria-checked', 'true');

    cy.get('#set-camera-preview-speed-level')
      .closest('.ant-select')
      .find('.ant-select-selection-item')
      .should('have.text', 'Low');

    cy.get('#set-default-units').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'mm');

    if (window.navigator.language === 'zh-TW') {
      cy.get('#set-default-font-family')
        .closest('.ant-select')
        .find('.ant-select-selection-item')
        .should('have.text', 'Noto Sans TC');

      cy.get('#set-default-font-style')
        .closest('.ant-select')
        .find('.ant-select-selection-item')
        .should('have.text', 'Regular');
    } else {
      cy.get('#set-default-font-family')
        .closest('.ant-select')
        .find('.ant-select-selection-item')
        .should('have.text', 'Noto Sans');

      cy.get('#set-default-font-style')
        .closest('.ant-select')
        .find('.ant-select-selection-item')
        .should('have.text', 'Regular');
    }

    cy.get('#set-default-model')
      .closest('.ant-select')
      .find('.ant-select-selection-item')
      .should('have.text', 'Beambox');

    // Switch - show_guides defaults to Off (false)
    cy.get('#set-guide').should('have.attr', 'aria-checked', 'false');

    cy.get('#set-guide-axis-x').should('have.attr', 'value', '0');
    cy.get('#set-guide-axis-y').should('have.attr', 'value', '0');

    cy.get('#set-bitmap-quality').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'Low');

    // Switch - anti-aliasing defaults to On (true)
    cy.get('#set-anti-aliasing').should('have.attr', 'aria-checked', 'true');

    // Switch - continuous_drawing defaults to Off (false)
    cy.get('#set-continuous-drawing').should('have.attr', 'aria-checked', 'false');

    // Switch - simplify_clipper_path defaults to Off (false)
    cy.get('#set-simplify-clipper-path').should('have.attr', 'aria-checked', 'false');

    // Switch - fast_gradient defaults to On (true)
    cy.get('#set-fast-gradient').should('have.attr', 'aria-checked', 'true');

    // Switch - vector_speed_constraint defaults to On (true)
    cy.get('#set-vector-speed-constraint').should('have.attr', 'aria-checked', 'true');

    cy.get('#loop-input').should('have.attr', 'value', '0');

    // Switch - font-substitute defaults to On (true)
    cy.get('#font-substitue').should('have.attr', 'aria-checked', 'true');

    cy.get('#font-convert').closest('.ant-select').find('.ant-select-selection-item').should('have.text', '2.0');

    // Switch - default-open-bottom defaults to Off (false)
    cy.get('#default-open-bottom').should('have.attr', 'aria-checked', 'false');

    // Switch - default-autofocus defaults to Off (false)
    cy.get('#default-autofocus').should('have.attr', 'aria-checked', 'false');

    // Switch - default-diode defaults to Off (false)
    cy.get('#default-diode').should('have.attr', 'aria-checked', 'false');

    cy.get('#set_diode_offset-x').should('have.attr', 'value', '70');
    cy.get('#set_diode_offset-y').should('have.attr', 'value', '7');

    // Switch - enable-sentry defaults to Off (false)
    cy.get('#set-sentry').should('have.attr', 'aria-checked', 'false');
  });

  it('change units and see if home page gets changed ', () => {
    cy.go2Preference();

    cy.get('#set-default-units').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Inches').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Inches');

    cy.contains('in').should('exist');
    applySettings();
    cy.get('#speed-input').should('have.attr', 'value', '0.79');
    cy.contains('in/s').should('exist');
  });

  it('change font and see if home page gets changed ', () => {
    cy.go2Preference();

    cy.get('#set-default-font-family').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();

    // Wait for the dropdown to be visible
    cy.get('.ant-select-dropdown').should('be.visible');
    // Scroll to the top of the dropdown options
    cy.get('.ant-select-dropdown .rc-virtual-list-holder').then(($el) => {
      $el[0].scrollTo(0, 0); // Scroll to the top
    });
    // Optionally, assert that the scroll position is at the top
    cy.get('.ant-select-dropdown .rc-virtual-list-holder').invoke('scrollTop').should('eq', 0);

    cy.get('.ant-select-item-option-content').contains('AirstreamNF').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'AirstreamNF');

    applySettings();

    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 }).inputText('Bring Any Design to Life');
    cy.get('.ant-select-selection-item[title="Font"]').should('have.text', 'AirstreamNF');
  });

  it('change font style and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-default-font-style').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Bold').click({ force: true });

    applySettings();

    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 }).inputText('Bring Any Design to Life');
    cy.get('.ant-select-selection-item[title="Style"]').should('have.text', 'Bold');
  });

  it('change document setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-default-model').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('beamo').click({ force: true });
    applySettings();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 3000 2100');

    cy.go2Preference();
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Beambox').click({ force: true });
    applySettings();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4000 3750');

    cy.go2Preference();
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Beambox Pro').click({ force: true });
    applySettings();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 6000 3750');
  });

  it('change guide setting and see if home page gets changed ', () => {
    cy.go2Preference();
    // Switch - click to toggle on
    cy.get('#set-guide').click();
    cy.get('#set-guide').should('have.attr', 'aria-checked', 'true');

    cy.get('#set-guide-axis-x').clear({ force: true }).type('10').blur();
    cy.get('#set-guide-axis-y').clear({ force: true }).type('10').blur();
    applySettings();
    cy.get('#horizontal_guide').should('exist').should('have.attr', 'x1', '0').should('have.attr', 'y1', '100');
    cy.get('#vertical_guide').should('exist').should('have.attr', 'x1', '100').should('have.attr', 'y1', '0');
  });

  it('change bitmap preview quality setting and see if home page gets changed ', () => {
    cy.go2Preference();

    cy.get('#set-bitmap-quality').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Normal').click({ force: true });
    applySettings();

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
    // Switch - anti-aliasing defaults to true, so we verify it's on
    cy.get('#set-anti-aliasing').should('have.attr', 'aria-checked', 'true');
    applySettings();
    drawingEllipse();
    cy.get('svg#svgcontent').should(($shapeRendering) => {
      let str = $shapeRendering.attr('style');
      expect(str.substring(50)).equal('');
    });
  });

  it('change continuous drawing setting and see if home page gets changed ', () => {
    cy.go2Preference();
    // Switch - click to toggle on
    cy.get('#set-continuous-drawing').click();
    cy.get('#set-continuous-drawing').should('have.attr', 'aria-checked', 'true');
    applySettings();

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

  it('click reset button and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('b').click();
    cy.url().should('contain', `${baseUrl}/#/`);
    cy.get('h1.headline').should('exist');
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
    cy.go2Preference(true);

    // Switch - click to toggle off
    cy.get('#set-vector-speed-constraint').click();
    cy.get('#set-vector-speed-constraint').should('have.attr', 'aria-checked', 'false');
    applySettings();
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
