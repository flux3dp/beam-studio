const layerListClassPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-LayerPanel-LayerList-module__';
const addLayerBtnPrefix = '_-_-packages-core-src-web-app-components-beambox-right-panel-AddLayerButton-module__btn';
const layerColorPickerPrefix = '_-_-packages-core-src-web-app-widgets-ColorPicker-module__';
const layerNameSelector =
  'div[class*="src-web-app-views-beambox-Right-Panels-ConfigPanel-ConfigPanel-module__layername"]';

describe('manipulate layers (basic)', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('the side panel and its components should exist', () => {
    cy.get('div#sidepanels').should('exist');
    cy.get('div.right-panel-tabs').should('exist');
    cy.get('div#layerpanel').should('exist');
    cy.get('div#laser-panel').should('exist');
  });

  it('there is only one layer by default', () => {
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 1);
    cy.get(`div[class*="${layerListClassPrefix}current"]`).should('have.length', 1);
    cy.get(`div[class*="${layerListClassPrefix}item"] div[class*="${layerListClassPrefix}name"]`).should(
      'have.text',
      'Layer 1',
    );
    cy.get(layerNameSelector).should('have.text', 'Parameter Settings (Layer 1)');
    cy.get(`div[class*="${layerColorPickerPrefix}color"]`).should('have.attr', 'style', 'background: rgb(51, 51, 51);');
  });

  it('add one new layer', () => {
    cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 2);
    cy.get(`div[class*="${layerListClassPrefix}current"]`).should('have.length', 1);
    cy.get(`div[class*="${layerListClassPrefix}current"]`).should('have.attr', 'data-layer').should('eq', 'Layer 2');
    cy.get(layerNameSelector).should('have.text', 'Parameter Settings (Layer 2)');
    cy.get(`div[class*="${layerColorPickerPrefix}color"]`).should(
      'have.attr',
      'style',
      'background: rgb(63, 81, 181);',
    );
  });

  it('rename the new layer', () => {
    cy.get(`div[class*="${layerListClassPrefix}item"]`).dblclick();
    cy.get('input.text-input').clear().type('Hello Flux');
    cy.get('button[class^="ant-btn"]').contains('OK').click();
    cy.get(layerNameSelector).should('have.text', 'Parameter Settings (Hello Flux)');
  });

  it('delete the layer', () => {
    cy.get(`div[class*="${layerListClassPrefix}item"]`).trigger('mousedown', { button: 2 });
    cy.get('#deletelayer').click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 1);
    cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 2);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(1).click().trigger('mousedown', { button: 2 });
    cy.get('#deletelayer').click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 1);
    cy.get(`div[class*="${layerListClassPrefix}item"] div[class*="${layerListClassPrefix}name"]`).should(
      'have.text',
      'Layer 2',
    );
  });
});

export {};
