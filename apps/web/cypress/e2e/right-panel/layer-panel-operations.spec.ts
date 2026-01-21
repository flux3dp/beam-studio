const layerListClassPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-LayerPanel-LayerList-module__';
const addLayerBtnPrefix = '_-_-packages-core-src-web-app-components-beambox-right-panel-AddLayerButton-module__btn';
const layerColorPickerPrefix = '_-_-packages-core-src-web-app-widgets-ColorPicker-module__';

describe('manipulate layers (operations)', () => {
  beforeEach(() => {
    cy.landingEditor();
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
      const svgCanvas = (win as any).svgCanvas;
      const el = svgCanvas.getSelectedElems();
      cy.wrap(el).should('have.length', 0);
    });
  });

  it('hide the layer ', () => {
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
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).scrollIntoView();
    cy.get(`div[class*="${layerListClassPrefix}item"]`).eq(0).trigger('mousedown', { button: 2 });
    cy.get('#merge_down_layer').click({ force: true });
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
});

export {};
