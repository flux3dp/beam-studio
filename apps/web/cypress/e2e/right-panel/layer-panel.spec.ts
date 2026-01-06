const layerListClassPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-LayerPanel-LayerList-module__';
const addLayerBtnPrefix = '_-_-packages-core-src-web-app-components-beambox-right-panel-AddLayerButton-module__btn';
const layerColorPickerPrefix = '_-_-packages-core-src-web-app-widgets-ColorPicker-module__';
const layerNameSelector =
  'div[class*="src-web-app-views-beambox-Right-Panels-ConfigPanel-ConfigPanel-module__layername"]';

describe('manipulate layers', () => {
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

  it('duplicate the layer', () => {
    cy.get(`div[class*="${layerListClassPrefix}item"]`).trigger('mousedown', { button: 2 });
    cy.get('#dupelayer').click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 2);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).should('have.text', 'Layer 1 copy');
    cy.get(`div[class*="${layerColorPickerPrefix}color"]`).should('have.attr', 'style', 'background: rgb(51, 51, 51);');
  });

  it('drag the layer ', () => {
    cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"][data-testid="Layer 2"]`).trigger('dragstart');
    cy.get(`div[class*="${layerListClassPrefix}drag-sensor-area"][data-index="0"]`).trigger('dragenter');
    cy.get(`div[class*="${layerListClassPrefix}item"][data-testid="Layer 2"]`).trigger('dragend');
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(1).should('have.text', 'Layer 2');
  });

  it('lock the layer ', () => {
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).trigger('mousedown', { button: 2 });
    cy.get('#locklayer').click({ force: true });
    cy.get('#layerlock-0 > img').should('have.css', 'display', 'block');
    cy.get('#layerlock-0 > img').should('be.visible');
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('g.layer').should('have.attr', 'data-lock', 'true');
    cy.clickToolBtn('Cursor');
    cy.get('svg#svgcontent').trigger('mousedown', -10, -10, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.window().then((win) => {
      const el = win.eval('svgCanvas.getSelectedElems()');
      cy.get(el).should('length', '0');
    });
  });

  it('hide the layer ', () => {
    cy.wait(1000);
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('div.tab.layers').click();
    cy.get(`div[class*="${layerListClassPrefix}vis"]`).click();
    cy.get('#svg_1').should('be.hidden');
  });

  it('merge all layer', () => {
    for (let n = 0; n < 9; n += 1) {
      cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    }
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 10);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).trigger('mousedown', { button: 2 });
    cy.get('#merge_all_layer').click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 1);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).should('have.text', 'Layer 1');
  });

  it('merge down one layer', () => {
    cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 2);
    cy.wait(500);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).scrollIntoView();
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).trigger('mousedown', { button: 2 });
    cy.get('#merge_down_layer').click({ force: true });
    cy.wait(500);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 1);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).should('have.text', 'Layer 1');
  });

  it('merge the layer selected', () => {
    for (let n = 0; n < 3; n += 1) {
      cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    }
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 4);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).should('have.text', 'Layer 4');
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).click();
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(1).trigger('mousedown', { button: 2, metaKey: true });
    cy.get('#merge_down_layer').click({ force: true });
    cy.get(`div[class*="${layerListClassPrefix}item"]`).should('have.length', 3);
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).should('have.text', 'Layer 3');
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(1).should('have.text', 'Layer 2');
    cy.get(`div[class*="${layerColorPickerPrefix}color"]`).should(
      'have.attr',
      'style',
      'background: rgb(244, 67, 54);',
    );
  });

  it('switch the layer and check the parameter ', () => {
    cy.selectPreset('Wood - 3mm Cutting');
    cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    cy.selectPreset('Acrylic - 3mm Cutting');
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(1).click();
    cy.get('#power-input').should('have.value', '60');
    cy.get('#speed-input').should('have.value', '6');
    cy.get('#repeat').should('have.value', '1');
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).click();
    cy.get('#power-input').should('have.value', '60');
    cy.get('#speed-input').should('have.value', '8');
    cy.get('#repeat').should('have.value', '1');
  });

  it('create object on different layer and check the color', () => {
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('have.attr', 'stroke', '#333333');
    cy.get('div.tab.layers').click();
    cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_2').should('have.attr', 'stroke', '#3F51B5');
  });

  it('move object to different layer', () => {
    cy.wait(300);
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('div.tab.layers').click();
    cy.wait(100);
    cy.selectPreset('Leather - 3mm Cutting');
    cy.get('#power-input').should('have.value', '65');
    cy.get('#speed-input').should('have.value', '3');
    cy.get('#repeat').should('have.value', '1');
    cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    cy.selectPreset('Fabric - 5mm Cutting');
    cy.get('#svg_1').click({ force: true });
    cy.get('div.tab.layers').click({ force: true });
    cy.moveElementToLayer('Layer 2');
    cy.get('#svg_1').should('have.attr', 'stroke', '#3F51B5');
    cy.clickToolBtn('Cursor');
    cy.get('#svg_1').click({ force: true });
    cy.get('div.tab.layers').click();
    cy.wait(500);
    cy.get('#power-input').should('have.value', '60');
    cy.get('#speed-input').should('have.value', '20');
    cy.get('#repeat').should('have.value', '1');
  });
});
