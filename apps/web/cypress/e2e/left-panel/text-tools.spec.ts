describe('text tools', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  const fontDisplay = () =>
    cy.get('.ant-select[title="Font"]').get('.ant-select-selector').get('.ant-select-selection-item img');

  const drawText1 = () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 });
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('TEST TEXT FONT');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.get('.tab.objects').click();
  };

  const drawText2 = () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 150, y: 150 });
    // Wait for text element to be created
    cy.get('#svg_2').should('exist');
    cy.inputText('TEST TEXT STYLE');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.realPress(['Enter']);
  };

  it('text font', () => {
    drawText1();
    cy.get('div#object-panel').should('exist');
    cy.get('.ant-select[title="Font"]').click();
    // Wait for font list to load
    cy.get('.rc-virtual-list-holder img[alt="Noto Sans"]').should('be.visible').click();
    fontDisplay().should('have.attr', 'alt').and('eq', 'Noto Sans');
    cy.get('#svg_1')
      .should('have.attr', 'font-family')
      .and('match', /'?Noto Sans'?/);
  });

  it('text style', () => {
    drawText1();
    drawText2();
    cy.get('div#object-panel').should('exist');
    cy.get('.ant-select-selection-item[title="Font"]').click();
    cy.get('.rc-virtual-list-holder img[alt="Noto Sans"]').click();
    cy.get('.ant-select[title="Style"]').click();
    cy.contains('Italic').click();
    cy.get('#svg_2').should('have.attr', 'font-style').and('eq', 'italic');
  });

  it('text size', () => {
    drawText1();
    drawText2();
    cy.get('#svg_1').click();
    cy.get('div[title="Size"] > input').should('have.value', '200').clear().type('100').blur();
    cy.get('#svg_1').should('have.attr', 'font-size').and('eq', '100');

    cy.get('#svg_2').click();
    cy.get('div[title="Size"] > input').should('have.value', '200').clear().type('50').blur();
    cy.get('#svg_2').should('have.attr', 'font-size').and('eq', '50');
  });

  it('text letter spacing', () => {
    drawText1();
    drawText2();
    cy.get('#svg_1').click();
    cy.get('div[title="Letter spacing"] > input').should('have.value', '0').clear().type('0.5').blur();
    cy.get('#svg_1').should('have.attr', 'letter-spacing').and('eq', '0.5em');

    cy.get('#svg_2').click();
    cy.get('div[title="Letter spacing"] > input').should('have.value', '0').clear().type('1.5').blur();
    cy.get('#svg_2').should('have.attr', 'letter-spacing').and('eq', '1.5em');
  });

  it('line spacing', () => {
    drawText1();
    drawText2();
    cy.get('#svg_1').dblclick();
    cy.realPress(['Shift', 'Enter']);
    cy.inputText('LINE SPACING TEST');
    cy.get('#svg_1').should('include.text', 'TEXT FONTLINE SPACING TEST');
    cy.get('div[title="Line spacing"] > input').should('have.value', '1').clear().type('1.5').blur();
    cy.get('#svg_1').should('have.attr', 'data-line-spacing').and('eq', '1.5');

    cy.get('#svg_2').dblclick();
    cy.realPress(['Shift', 'Enter']);
    cy.inputText('LINE SPACING TEST');
    cy.get('#svg_2').should('include.text', 'TEXT STYLELINE SPACING TEST');
    cy.get('div[title="Line spacing"] > input').should('have.value', '1').clear().type('5').blur();
    cy.get('#svg_2').should('have.attr', 'data-line-spacing').and('eq', '5');
  });

  it('vertical', () => {
    drawText1();
    cy.get('button[title="Vertical text"]').eq(0).click();
    cy.get('#svg_1').should('have.attr', 'data-verti').and('eq', 'true');
  });

  it('infill', () => {
    drawText1();
    cy.get('#svg_1').should('have.attr', 'fill').and('not.eq', 'none');
    cy.get('button[title="Infill"]').click();
    cy.get('#svg_1').should('have.attr', 'fill').and('eq', 'none');
  });
});
