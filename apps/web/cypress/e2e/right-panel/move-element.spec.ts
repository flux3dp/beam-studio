describe('move element to another layer', () => {
  beforeEach(() => {
    cy.landingEditor();
    cy.get('g.layer')
      .eq(0)
      .should('have.attr', 'data-strength', '15')
      .should('have.attr', 'data-speed', '20')
      .should('have.attr', 'data-repeat', '1');
    cy.get('[class*="src-web-app-components-beambox-right-panel-AddLayerButton-module__btn"]').click({ force: true });
    cy.get('#power-input').clear().type('50{enter}');
    cy.get('#speed-input').clear().type('100{enter}');
    cy.get('#repeat').clear().type('5{enter}');
    cy.get('g.layer')
      .eq(1)
      .should('have.attr', 'data-strength', '50')
      .should('have.attr', 'data-speed', '100')
      .should('have.attr', 'data-repeat', '5');
    cy.get('#layerdoubleclick-0').contains('Layer 1').click();
    cy.get('#power-input').should('have.attr', 'value', '15');
    cy.get('#speed-input').should('have.attr', 'value', '20');
    cy.get('#repeat').should('have.attr', 'value', '1');
  });

  it('move one element', () => {
    cy.clickToolBtn('Element');
    cy.get('.ant-modal-header').contains('Element').should('exist');
    cy.get('.anticon[id="basic/icon-circle"]').click();
    cy.get('#svg_1').should('exist').should('have.attr', 'fill', '#333333');
    cy.get('#svg_1').click();
    cy.get('.tab.layers').click();
    cy.get('#power-input').should('have.attr', 'value', '15');
    cy.get('#speed-input').should('have.attr', 'value', '20');
    cy.get('#repeat').should('have.attr', 'value', '1');
    cy.get('[class*="src-web-app-components-beambox-right-panel-SelLayerBlock-module__select"]').select('Layer 2');
    cy.get('.ant-btn').contains('Yes').click();
    cy.get('#svg_1').click();
    cy.get('#svg_1').should('have.attr', 'fill', '#3F51B5');
    cy.get('#power-input').should('have.attr', 'value', '50');
    cy.get('#speed-input').should('have.attr', 'value', '100');
    cy.get('#repeat').should('have.attr', 'value', '5');
  });

  it('move multiple elements', () => {
    cy.contains('Layer 1').click();

    cy.clickToolBtn('Element');
    cy.get('.ant-modal-header').contains('Element').should('exist');
    cy.get('.anticon[id="basic/icon-circle"]').click();
    cy.get('.ant-modal-mask', { timeout: 10000 }).should('not.exist');

    cy.clickToolBtn('Element');
    cy.get('.adm-capsule-tabs-tab-wrapper').contains('Decor').click();
    cy.get('.anticon[id="decor/i_circular-1"]').click();
    cy.get('.ant-modal-mask', { timeout: 10000 }).should('not.exist');

    cy.clickToolBtn('Element');
    cy.get('.adm-capsule-tabs-tab-wrapper').contains('Animal').click();
    cy.get('.anticon[id="animals/i_land-1"]').click();
    cy.get('.ant-modal-mask', { timeout: 10000 }).should('not.exist');

    cy.get('#svg_19').should('exist');
    cy.get('svg#svgcontent')
      .trigger('mousedown', 100, 100, { force: true })
      .trigger('mousemove', 0, 0, { force: true })
      .trigger('mouseup', { force: true });

    cy.get('.tab.layers').click();
    cy.get('#power-input').should('have.attr', 'value', '15');
    cy.get('#speed-input').should('have.attr', 'value', '20');
    cy.get('#repeat').should('have.attr', 'value', '1');
    cy.get('[class*="src-web-app-components-beambox-right-panel-SelLayerBlock-module__select--"]', {
      timeout: 100000,
    }).select('Layer 2');
    cy.get('.ant-btn').contains('Yes').click();
    cy.get('#power-input').should('have.attr', 'value', '50');
    cy.get('#speed-input').should('have.attr', 'value', '100');
    cy.get('#repeat').should('have.attr', 'value', '5');
    cy.get('#svg_1').should('exist').should('have.attr', 'fill', '#3F51B5');
    cy.get('#svg_10').should('exist').should('have.attr', 'fill', '#3F51B5');
    cy.get('#svg_19').should('exist').should('have.attr', 'fill', '#3F51B5');
  });
});
