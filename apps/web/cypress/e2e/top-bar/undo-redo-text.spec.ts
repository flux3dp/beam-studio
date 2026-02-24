const undoBtn = () => cy.get('div[title="Undo"]');
const redoBtn = () => cy.get('div[title="Redo"]');
const fontDisplay = () => cy.get('.ant-select-selection-item[title="Font"] img');

describe('verify undo/redo behaviors', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  const drawText = () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 10, y: 20 });
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('Test Undo/Redo{enter}');
    cy.get('#svg_1').should('contain.text', 'Test Undo/Redo');
    cy.get('.tab.objects').click();
  };

  it('text', () => {
    drawText();
    undoBtn().click();
    cy.get('#svg_1').should('not.exist');
    redoBtn().click();
    cy.get('#svg_1').should('exist');
  });

  it('text with font', () => {
    drawText();
    cy.get('.ant-select-selection-item[title="Font"]').click();
    cy.get('.rc-virtual-list-holder img[alt="lobster"]').click();
    cy.get('#svg_1').click({ force: true });
    fontDisplay().should('have.attr', 'alt').and('eq', 'lobster');
    undoBtn().click();
    cy.get('#svg_1').click({ force: true });
    fontDisplay().should('have.attr', 'alt').and('not.eq', 'lobster');
    redoBtn().click();
    cy.get('#svg_1').click({ force: true });
    fontDisplay().should('have.attr', 'alt').and('eq', 'lobster');
  });

  it('text with style', () => {
    drawText();
    cy.get('.ant-select-selection-item[title="Style"]').should('have.text', 'Regular');
    cy.get('.ant-select-selection-item[title="Style"]').click();
    cy.get('.ant-select-dropdown').should('be.visible');
    cy.contains('.ant-select-item-option-content', 'Bold').click({ force: true });
    cy.get('.ant-select-selection-item[title="Style"]').should('have.text', 'Bold');
    undoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('.ant-select[title="Style"]').should('have.text', 'Regular');
    redoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('.ant-select[title="Style"]').should('have.text', 'Bold');
  });

  it('text with size', () => {
    drawText();
    cy.get('#font_size').should('have.value', '200');
    cy.get('#font_size').clear().type('400').blur();
    undoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#font_size').should('have.value', '200');
    redoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#font_size').should('have.value', '400');
  });

  it('text with letter spacing', () => {
    drawText();
    cy.get('#letter_spacing').should('have.value', '0');
    cy.get('#letter_spacing').clear().type('1').blur();
    undoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#letter_spacing').should('have.value', '0');
    redoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#letter_spacing').should('have.value', '1');
  });

  it('text with line spacing', () => {
    drawText();
    cy.get('#line_spacing').should('have.value', '1');
    cy.get('#line_spacing').clear().type('2').blur();
    undoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#line_spacing').should('have.value', '1');
    redoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#line_spacing').should('have.value', '2');
  });

  it('text with vertical', () => {
    drawText();
    cy.get('#vertical-text').invoke('attr', 'class').should('not.contain', 'active');
    cy.get('#vertical-text').click();
    cy.get('#vertical-text').invoke('attr', 'class').should('contain', 'active');
    undoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#w_size').invoke('prop', 'value').then(parseInt).should('be.gt', 140);
    cy.get('#h_size').invoke('prop', 'value').then(parseInt).should('be.lt', 30);
    cy.get('#vertical-text').invoke('attr', 'class').should('not.contain', 'active');
    redoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#w_size').invoke('prop', 'value').then(parseInt).should('be.lt', 20);
    cy.get('#h_size').invoke('prop', 'value').then(parseInt).should('be.gt', 280);
    cy.get('#vertical-text').invoke('attr', 'class').should('contain', 'active');
  });

  it('text with infill', () => {
    drawText();
    cy.get('#infill').invoke('attr', 'class').should('contain', 'filled');
    cy.get('#infill').click();
    cy.get('#infill').invoke('attr', 'class').should('not.contain', 'filled');
    undoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#svg_1').should('not.have.attr', 'fill', 'none');
    cy.get('#infill').invoke('attr', 'class').should('contain', 'filled');
    redoBtn().click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#svg_1').should('have.attr', 'fill', 'none');
    cy.get('#infill').invoke('attr', 'class').should('not.contain', 'filled');
  });
});
