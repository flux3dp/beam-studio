describe('move element to another layer', () => {
  beforeEach(() => {
    cy.landingEditor();
    verifyLayer(0, { strength: '15', speed: '20', repeat: '1' });

    addLayer({ strength: '50', speed: '100', repeat: '5' });
    verifyLayer(1, { strength: '50', speed: '100', repeat: '5' });

    cy.get('#layerdoubleclick-0').contains('Layer 1').click();
    verifyInputValues({ strength: '15', speed: '20', repeat: '1' });
  });

  function verifyLayer(index, { strength, speed, repeat }) {
    cy.get('g.layer')
      .eq(index)
      .should('have.attr', 'data-strength', strength)
      .should('have.attr', 'data-speed', speed)
      .should('have.attr', 'data-repeat', repeat);
  }

  function addLayer({ strength, speed, repeat }) {
    cy.get('[class*="AddLayerButton-module__btn"]').click({ force: true });
    cy.get('#power-input').clear().type(`${strength}{enter}`);
    cy.get('#speed-input').clear().type(`${speed}{enter}`);
    cy.get('#repeat').clear().type(`${repeat}{enter}`);
  }

  function verifyInputValues({ strength, speed, repeat }) {
    cy.get('#power-input').should('have.attr', 'value', strength);
    cy.get('#speed-input').should('have.attr', 'value', speed);
    cy.get('#repeat').should('have.attr', 'value', repeat);
  }

  function moveToLayer(elementId, targetLayer) {
    cy.get(elementId).click({ force: true });
    cy.get('.tab.layers').click();

    verifyInputValues({ strength: '15', speed: '20', repeat: '1' });

    cy.get('[class*="SelLayerBlock-module__select"]').select(targetLayer);
    cy.get('.ant-btn').contains('Yes').click();
  }

  it('move one element', () => {
    cy.clickToolBtn('Element', false);
    cy.get('.anticon[id="basic/icon-circle"]').click();
    cy.get('#svg_1').should('exist').should('have.attr', 'fill', '#333333');
    cy.get('.ant-drawer', { timeout: 10000 }).should('not.exist');

    moveToLayer('#svg_1', 'Layer 2');

    cy.get('#svg_1').should('have.attr', 'fill', '#3F51B5');
    verifyInputValues({ strength: '50', speed: '100', repeat: '5' });
  });

  it('move multiple elements', () => {
    const elements = [
      { category: 'Basic', icon: 'basic/icon-circle' },
      { category: 'Decor', icon: 'decor/i_circular-1' },
      { category: 'Animal', icon: 'animals/i_land-1' },
    ];

    elements.forEach(({ category, icon }) => {
      cy.clickToolBtn('Element', false);
      cy.get('.ant-drawer-header .ant-select-selector').click();
      cy.get('.ant-select-item-option').contains(category).click();
      cy.get(`.anticon[id="${icon}"]`).click();
      cy.get('.ant-drawer', { timeout: 10000 }).should('not.exist');
    });

    cy.get('#svg_19').should('exist');
    cy.get('svg#svgcontent')
      .trigger('mousedown', 100, 100, { force: true })
      .trigger('mousemove', 0, 0, { force: true })
      .trigger('mouseup', { force: true });

    moveToLayer('#svg_1', 'Layer 2');
    verifyInputValues({ strength: '50', speed: '100', repeat: '5' });

    ['#svg_1', '#svg_10', '#svg_19'].forEach((id) => {
      cy.get(id).should('exist').should('have.attr', 'fill', '#3F51B5');
    });
  });
});
