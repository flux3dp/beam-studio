describe('drawing', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('rectangle', () => {
    cy.clickToolBtn('Rectangle');
    cy.get('g#selectorParentGroup').should('have.css', 'cursor', 'crosshair');

    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    cy.get('#svg_1').should('have.attr', 'fill').and('eq', 'none');
    cy.getElementTitle().should('have.text', 'Layer 1 > Rectangle');
    cy.get('div#object-panel').should('exist');

    cy.get('#selectorGrip_resize_ne')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(301, 2);
        expect($grip.attr('cy')).to.be.closeTo(99.5, 2);
      });
    cy.get('#selectorGrip_resize_sw')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(100, 2);
        expect($grip.attr('cy')).to.be.closeTo(200, 2);
      });
    cy.get('.tab.objects').click();
    cy.get('button#infill').click();
    cy.get('#svg_1').should('have.attr', 'fill').and('not.eq', 'none');
  });

  it('ellipse', () => {
    cy.clickToolBtn('Ellipse');
    cy.get('g#selectorParentGroup').should('have.css', 'cursor', 'crosshair');

    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    cy.get('#svg_1').should('have.attr', 'fill').and('eq', 'none');
    cy.getElementTitle().should('have.text', 'Layer 1 > Oval');
    cy.get('div#object-panel').should('exist');

    cy.get('#selectorGrip_resize_ne')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(400, 2);
      });
    cy.get('#selectorGrip_resize_sw')
      .first()
      .should(($grip) => {
        expect($grip.attr('cy')).to.be.closeTo(400, 2);
      });

    cy.get('.tab.objects').click();
    cy.get('button#infill').click();
    cy.get('#svg_1').should('have.attr', 'fill').and('not.eq', 'none');
  });

  it('polygon', () => {
    cy.clickToolBtn('Polygon');
    cy.get('g#selectorParentGroup').should('have.css', 'cursor', 'crosshair');

    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    cy.get('#svg_1').should('have.attr', 'fill').and('eq', 'none');
    cy.getElementTitle().should('have.text', 'Layer 1 > Polygon');
    cy.get('div#object-panel').should('exist');

    cy.get('#selectorGrip_resize_ne')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(453, 2);
      });
    cy.get('#selectorGrip_resize_sw')
      .first()
      .should(($grip) => {
        expect($grip.attr('cy')).to.be.closeTo(453, 2);
      });

    cy.get('.tab.objects').click();
    cy.get('#polygon-sides > input').clear().type('8').blur();
    cy.get('#svg_1').should('have.attr', 'sides').and('eq', '8');

    cy.get('button#infill').click();
    cy.get('#svg_1').should('have.attr', 'fill').and('not.eq', 'none');
  });

  it('line', () => {
    cy.clickToolBtn('Line');
    cy.get('g#selectorParentGroup').should('have.css', 'cursor', 'crosshair');

    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });

    cy.get('#selectorGrip_resize_ne')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(301, 1);
      });
    cy.get('#selectorGrip_resize_nw')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(100, 1);
      });

    cy.get('#svg_1').should('exist');
    cy.getElementTitle().should('have.text', 'Layer 1 > Line');
    cy.get('div#object-panel').should('exist');
  });

  it('pen', () => {
    cy.clickToolBtn('Pen');
    cy.get('g#selectorParentGroup').should('have.css', 'cursor', 'crosshair');

    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 200, 0, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 0, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 0, 0, { force: true });

    cy.get('#svg_1').should('exist');
    cy.get('div#pathedit-panel').should('exist');

    cy.get('#pathpointgrip_0')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(100, 1);
      });
    cy.get('#pathpointgrip_1')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(300, 1);
      });
    cy.get('#pathpointgrip_2')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(301, 1);
      });
    cy.get('#pathpointgrip_3')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(100, 1);
      });
  });
});
