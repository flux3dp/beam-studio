describe('mirror tools', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('horizontal flip ', () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 });
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('TEST TEXT HORIZONTAL');
    cy.get('.tab.objects').click();
    cy.get('#horizontal_flip').click();
    cy.get('#svg_1').should(($value) => {
      const str = $value.attr('transform');
      expect(str.substring(7, 15)).equal('-1 0 0 1');
    });
  });

  it('vertical flip', () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 });
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('TEST TEXT VERTICAL');
    cy.get('.tab.objects').click();
    cy.get('#vertical_flip').click();
    cy.get('#svg_1').should(($value) => {
      const str = $value.attr('transform');
      expect(str.substring(7, 15)).equal('1 0 0 -1');
    });
  });
});
