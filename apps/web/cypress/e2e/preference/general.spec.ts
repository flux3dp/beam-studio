import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const laserPanelBlockPrefix = 'src-web-app-views-beambox-Right-Panels-ConfigPanel-Block-module__';

function drawingEllipse() {
  cy.clickToolBtn('Ellipse');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });
}

function applySettings() {
  cy.get('div.btn-done').click();
  cy.wait(1000);
}

describe('update the preference', () => {
  const { baseUrl } = Cypress.config();
  beforeEach(() => {
    cy.landingEditor();
  });

  it('check default value with preference page', () => {
    cy.go2Preference();
    cy.get('#select-lang').find('option:selected').should('have.text', 'English');
    cy.get('#ip-input').should('have.attr', 'value', '192.168.1.1');
    cy.get('#set-guessing-poke').find('option:selected').should('have.value', '1');
    cy.get('#set-auto-connect').find('option:selected').should('have.value', '1');
    cy.get('#preview-input').should('have.attr', 'value', '100');
    cy.get('#diode-preview-input').should('have.attr', 'value', '60');
    cy.get('#set-default-units').find('option:selected').should('have.value', 'mm');
    if (window.navigator.language === 'zh-TW') {
      cy.get('#set-default-font-family')
        .find('option:selected')
        .should('have.value', 'Noto Sans TC');
      cy.get('#set-default-font-style')
        .find('option:selected')
        .should('have.value', 'NotoSansTC-Regular');
    } else {
      cy.get('#set-default-font-family').find('option:selected').should('have.value', 'Noto Sans');
      cy.get('#set-default-font-style')
        .find('option:selected')
        .should('have.value', 'NotoSans-Regular');
    }
    cy.get('#set-default-model').find('option:selected').should('have.value', 'fbb1b');
    cy.get('#set-guide').find('option:selected').should('have.value', 'FALSE');
    cy.get('#guide-x-input').should('have.attr', 'value', '0.00');
    cy.get('#guide-y-input').should('have.attr', 'value', '0.00');
    cy.get('#set-bitmap-quality').find('option:selected').should('have.value', 'TRUE');
    cy.get('#set-anti-aliasing').find('option:selected').should('have.value', 'TRUE');
    cy.get('#set-continuous-drawingg').find('option:selected').should('have.value', 'FALSE');
    cy.get('#set-simplify-clipper-path').find('option:selected').should('have.value', 'FALSE');
    cy.get('#set-fast-gradient').find('option:selected').should('have.value', 'TRUE');
    cy.get('#set-vector-speed-contraint').find('option:selected').should('have.value', 'TRUE');
    cy.get('#loop-input').should('have.attr', 'value', '0.00');
    cy.get('#set-mask').find('option:selected').should('have.value', 'FALSE');
    cy.get('#font-substitue').find('option:selected').should('have.value', 'TRUE');
    cy.get('#font-convert').find('option:selected').should('have.value', '2.0');
    cy.get('#default-open-bottom').find('option:selected').should('have.value', 'FALSE');
    cy.get('#default-autofocus').find('option:selected').should('have.value', 'FALSE');
    cy.get('#default-diode').find('option:selected').should('have.value', 'FALSE');
    cy.get('#diode-offset-x-input').should('have.attr', 'value', '70.00');
    cy.get('#diode-offset-y-input').should('have.attr', 'value', '7.00');
    cy.get('#set-sentry').find('option:selected').should('have.value', '0');
  });

  it('change units and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-default-units').select('inches');
    cy.get('#preview-input').should('have.attr', 'value', '3.94');
    cy.get('#diode-preview-input').should('have.attr', 'value', '2.36');
    cy.contains('in/s').should('exist');
    cy.contains('in').should('exist');
    applySettings();
    cy.get('#speed-input').should('have.attr', 'value', '0.79');
    cy.contains('in/s').should('exist');
  });

  it('change font and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-default-font-family').select('AirstreamNF');
    applySettings();
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 }).inputText('Bring Any Design to Life');
    cy.get('.ant-select-selection-item[title="Font"]').should('have.text', 'AirstreamNF');
  });

  it('change font style and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-default-font-style').select('Bold');
    applySettings();
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 }).inputText('Bring Any Design to Life');
    cy.get('.ant-select-selection-item[title="Style"]').should('have.text', 'Bold');
  });

  it('change document setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-default-model').select('fbm1');
    applySettings();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 3000 2100');

    cy.go2Preference();
    cy.get('#set-default-model').select('fbb1b');
    applySettings();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4000 3750');

    cy.go2Preference();
    cy.get('#set-default-model').select('fbb1p');
    applySettings();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 6000 3750');
  });

  it('change guide setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-guide').select('On');
    cy.get('#guide-x-input').clear({ force: true }).type('10').blur();
    cy.get('#guide-y-input').clear({ force: true }).type('10').blur();
    applySettings();
    cy.get('#horizontal_guide')
      .should('exist')
      .should('have.attr', 'x1', '0')
      .should('have.attr', 'y1', '100');
    cy.get('#vertical_guide')
      .should('exist')
      .should('have.attr', 'x1', '100')
      .should('have.attr', 'y1', '0');
  });

  it('change bitmap preview quality setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-bitmap-quality').select('Normal');
    applySettings();
    cy.uploadFile('flux.png', 'image/png');
    cy.wait(3000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('89c7aa6cb93a4fd9f6e79c9da0e5ade2');
        else expect(md5(href)).equal('690258853fa3923356f12a971a2807f8');
      });
  });

  it('change anti aliasing setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-anti-aliasing').select('On');
    applySettings();
    drawingEllipse();
    cy.get('svg#svgcontent').should(($shapeRendering) => {
      let str = $shapeRendering.attr('style');
      expect(str.substring(50)).equal('');
    });
  });

  it('change continuous drawing setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('#set-continuous-drawingg').select('On');
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
      'The cutting speed of vector path objects will be constrained to 20 mm/s (0.79in/s).You can remove this limit at Preferences Settings.'
    );
    cy.go2Preference(true);
    cy.get('#set-vector-speed-contraint').select('Off');
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
