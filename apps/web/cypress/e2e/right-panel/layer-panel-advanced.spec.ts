const layerListClassPrefix =
  '_-_-packages-core-src-web-app-components-beambox-RightPanel-LayerPanel-LayerList-module__';
const addLayerBtnPrefix = '_-_-packages-core-src-web-app-components-beambox-RightPanel-AddLayerButton-module__btn';

describe('manipulate layers (advanced)', () => {
  beforeEach(() => {
    cy.landingEditor();
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
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('div.tab.layers').click();
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
    // Wait for layer panel to update with the new preset values
    cy.get('#power-input').should('have.value', '60');
    cy.get('#speed-input').should('have.value', '20');
    cy.get('#repeat').should('have.value', '1');
  });
});

export {};
