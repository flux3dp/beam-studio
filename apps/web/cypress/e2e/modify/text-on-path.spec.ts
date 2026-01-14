describe('text on path', () => {
  beforeEach(() => {
    cy.landingEditor();
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 });
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('123456789{enter}');
    cy.getElementTitle().contains('Layer 1 > Text');
    cy.clickToolBtn('Ellipse');
    cy.get('svg#svgcontent')
      .trigger('mousedown', { which: 1, pageX: 100, pageY: 50, force: true })
      .trigger('mousemove', { which: 1, pageX: 250, pageY: 200, shiftKey: true, force: true })
      .trigger('mouseup', { force: true });
    cy.getElementTitle().contains('Layer 1 > Oval');
    cy.get('svg#svgcontent').click({ force: true });
    // Wait for ellipse to be ready for selection
    cy.get('#svg_2').should('exist');
    cy.get('#svgcontent')
      .trigger('mousedown', { pageX: 1000, pageY: 1000, force: true })
      .trigger('mousemove', { pageX: 200, pageY: 100, force: true })
      .trigger('mouseup', { force: true });
    cy.getElementTitle().contains('Multiple Objects');
    cy.get('.tab.objects').click();
    cy.get('button#create_textpath').click();
    cy.getElementTitle().contains('Layer 1 > Text on Path');
    cy.get('#svg_1')
      .should('exist')
      .should('have.attr', 'fill', '#333333')
      .should('have.attr', 'fill-opacity', '1')
      .should('have.attr', 'stroke', '#333333');
    cy.get('#svg_2')
      .should('exist')
      .should('have.attr', 'fill', 'none')
      .should('have.attr', 'fill-opacity', '0')
      .should('have.attr', 'stroke', '#333333');
    cy.get('textPath')
      .should('exist')
      .should('have.attr', 'vector-effect', 'non-scaling-stroke')
      .should('have.attr', 'startOffset', '0%')
      .should('have.attr', 'href', '#svg_2')
      .should('have.text', '123456789');
  });

  it('alignment', () => {
    cy.get('[class="ant-select-selection-item"]').contains('Bottom Align').click();
    cy.get('[class="ant-select-item-option-content"]').contains('Middle Align').click();
    cy.get('textPath')
      .should('have.attr', 'vector-effect', 'non-scaling-stroke')
      .should('have.attr', 'startOffset', '0%')
      .should('have.attr', 'alignment-baseline', 'middle')
      .should('have.attr', 'dominant-baseline', 'middle')
      .should('have.attr', 'href', '#svg_2')
      .should('have.text', '123456789');

    cy.get('[class="ant-select-selection-item"]').contains('Middle Align').click();
    cy.get('[class="ant-select-item-option-content"]').contains('Top Align').click();
    cy.get('textPath')
      .should('exist')
      .should('have.attr', 'vector-effect', 'non-scaling-stroke')
      .should('have.attr', 'startOffset', '0%')
      .should('have.attr', 'alignment-baseline', 'top')
      .should('have.attr', 'dominant-baseline', 'hanging')
      .should('have.attr', 'href', '#svg_2')
      .should('have.text', '123456789');

    cy.get('[class="ant-select-selection-item"]').contains('Top Align').click();
    cy.get('[class="ant-select-item-option-content"]').contains('Bottom Align').click();
    cy.get('textPath')
      .should('exist')
      .should('have.attr', 'vector-effect', 'non-scaling-stroke')
      .should('have.attr', 'startOffset', '0%')
      .should('have.attr', 'alignment-baseline', 'auto')
      .should('have.attr', 'dominant-baseline', 'auto')
      .should('have.attr', 'href', '#svg_2')
      .should('have.text', '123456789');
  });

  it('offset', () => {
    cy.contains('Text Offset').siblings('div').find('input').clear().type('10{enter}');
    cy.get('textPath')
      .should('exist')
      .should('have.attr', 'vector-effect', 'non-scaling-stroke')
      .should('have.attr', 'startOffset', '10%')
      .should('have.attr', 'href', '#svg_2')
      .should('have.text', '123456789');
  });

  it('text infill', () => {
    cy.contains('Text Infill').siblings('button').click();
    cy.get('#svg_1')
      .should('exist')
      .should('have.attr', 'fill', 'none')
      .should('have.attr', 'fill-opacity', '0')
      .should('have.attr', 'stroke', '#333333');
  });

  it('path infill', () => {
    cy.contains('Path Infill').siblings('button').click();
    cy.get('#svg_2')
      .should('exist')
      .should('have.attr', 'fill', '#333333')
      .should('have.attr', 'fill-opacity', '1')
      .should('have.attr', 'stroke', '#333333');
  });

  it('decompose', () => {
    cy.get('button#detach_path').click();
    cy.getElementTitle().contains('Multiple Objects');
    cy.get('textPath').should('not.exist');
    cy.get('#svg_1').should('exist');
    cy.get('#svg_2').should('exist');
  });
});
