describe('verify copy/paste behaviors', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  const copyAndPaste = () => {
    cy.get('#svg_1').should('exist');
    cy.get('#svg_1').realClick({ button: 'right' });
    // Wait for context menu to appear
    cy.get('.ant-dropdown').should('be.visible');

    cy.get('.ant-dropdown-menu-item').contains('Copy').click();
    cy.get('#svg_1').realClick({ button: 'right' });
    cy.get('.ant-dropdown-menu-item').contains('Paste').click();
    cy.get('#svg_2').should('exist');
  };

  it('image', () => {
    cy.uploadFile('flux.png', 'image/png');
    copyAndPaste();
    cy.get('g.layer').find('image').should('have.length', '2');
  });

  it('geometry', () => {
    cy.clickToolBtn('Polygon');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    copyAndPaste();
    cy.get('g.layer').find('polygon').should('have.length', '2');
  });

  it('path', () => {
    cy.clickToolBtn('Line');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    copyAndPaste();
    cy.get('g.layer').find('line').should('have.length', '2');
  });

  it('text', () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 10, y: 20 });
    // Wait for text input to be ready
    cy.get('#svg_1').should('exist');
    cy.inputText('Test Copy And Paste');
    // Wait for text to be rendered
    cy.get('#svg_1').should('contain.text', 'Test Copy And Paste');
    copyAndPaste();
    cy.get('g.layer').find('text').should('have.length', '2');
  });
});
