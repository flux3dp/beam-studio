describe('array tools', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  const applyArray = () => {
    cy.clickToolBtn('Cursor');
    cy.get('svg#svgcontent').trigger('mousedown', -10, -10, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('.tab.objects').click();
    cy.get('#array').click();
    // Wait for modal to be ready, then use force: true to bypass race condition
    // caused by canvas mousedown handler blurring active elements during preview generation
    cy.findByTestId('column').should('be.visible');
    cy.findByTestId('column').clear({ force: true }).type('2', { force: true }).blur();
    cy.findByTestId('row').clear({ force: true }).type('2', { force: true }).blur();
    cy.findByTestId('dx').clear({ force: true }).type('100', { force: true }).blur();
    cy.findByTestId('dy').clear({ force: true }).type('150', { force: true }).blur();
    cy.findAllByText('Confirm').click();
    // Wait for modal to close
    cy.findByTestId('column').should('not.exist');
  };

  it('image', () => {
    cy.uploadFile('flux.png', 'image/png');
    applyArray();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]').children('image').should('have.length', '4');
  });

  it('geometry', () => {
    cy.clickToolBtn('Polygon');
    cy.get('svg#svgcontent').trigger('mousedown', 50, 50, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    applyArray();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]').children('polygon').should('have.length', '4');
  });

  it('path', () => {
    cy.clickToolBtn('Line');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    applyArray();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]').children('line').should('have.length', '4');
  });

  it('text', () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 10, y: 20 });
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('Test Array');
    applyArray();
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
    applyArray();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    // Verify 4 groups were created, each containing an image and ellipse
    cy.get('g[data-tempgroup="true"]').children('g').should('have.length', '4');
    cy.get('#svgcontent image').should('have.length', '4');
    cy.get('#svgcontent ellipse').should('have.length', '4');
  });

  it('multiselect', () => {
    cy.clickToolBtn('Line');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.clickToolBtn('Polygon');
    cy.get('svg#svgcontent').trigger('mousedown', 50, 50, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_2').should('exist');
    applyArray();
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('g[data-tempgroup="true"]', { timeout: 3000 }).children('line').should('have.length', '4');
    cy.get('g[data-tempgroup="true"]', { timeout: 3000 }).children('polygon').should('have.length', '4');
  });
});
