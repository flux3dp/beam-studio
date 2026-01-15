describe('array tools', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  const doAllThing = () => {
    cy.clickToolBtn('Cursor');
    cy.get('svg#svgcontent').trigger('mousedown', -10, -10, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('.tab.objects').click();
    cy.get('#array').click();
    cy.findByTestId('columns').clear().clear().type('2').blur();
    cy.findByTestId('rows').clear().clear().type('2').blur();
    cy.findByTestId('array_dx').clear().clear().type('100').blur();
    cy.findByTestId('array_dy').clear().clear().type('150').blur();
    cy.findAllByText('Confirm').click();
  };

  it('image', () => {
    cy.uploadFile('flux.png', 'image/png');
    doAllThing();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]').children('image').should('have.length', '4');
  });

  it('geometry', () => {
    cy.clickToolBtn('Polygon');
    cy.get('svg#svgcontent').trigger('mousedown', 50, 50, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    doAllThing();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]').children('polygon').should('have.length', '4');
  });

  it('path', () => {
    cy.clickToolBtn('Line');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    doAllThing();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]').children('line').should('have.length', '4');
  });

  it('text', () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 10, y: 20 });
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('Test Array');
    doAllThing();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]').children('text').should('have.length', '4');
  });

  it('group', () => {
    cy.uploadFile('flux.png', 'image/png');
    // Create ellipse
    cy.clickToolBtn('Ellipse');
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_2').should('exist');
    // Select both
    cy.get('svg#svgcontent').trigger('mousedown', 50, 50, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 600, 600, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('.tab.objects').click();
    cy.get('#group').click();
    doAllThing();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('#svg_11').children('image').should('have.length', '1');
    cy.get('#svgcontent ellipse').should('have.length', '4');
  });

  it('mutilselect', () => {
    cy.clickToolBtn('Line');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.clickToolBtn('Polygon');
    cy.get('svg#svgcontent').trigger('mousedown', 50, 50, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_2').should('exist');
    doAllThing();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]', { timeout: 3000 }).children('line').should('have.length', '4');
    cy.get('g[data-tempgroup="true"]', { timeout: 3000 }).children('polygon').should('have.length', '4');
  });
});
