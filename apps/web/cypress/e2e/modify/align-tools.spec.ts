describe('align tools', () => {
  function selectAll() {
    cy.clickToolBtn('Cursor');
    cy.get('svg#svgcontent').trigger('mousedown', -10, -10, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  }

  function drawingRect() {
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 50, 50, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');

    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 150, 150, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_2').should('exist');

    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 150, 150, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });

    cy.clickToolBtn('Cursor');
    cy.get('svg#svgcontent').trigger('mousedown', -10, -10, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
  }

  function checkGripPosition(selector: string, x: number, y: number) {
    cy.get(`#selectorGrip_resize_${selector}`)
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(x, 2);
      });
    cy.get(`#selectorGrip_resize_${selector}`)
      .first()
      .should(($grip) => {
        expect($grip.attr('cy')).to.be.closeTo(y, 2);
      });
  }

  beforeEach(() => {
    cy.landingEditor();
    drawingRect();
    selectAll();
    cy.showPanel('objects');
  });

  it('top align', () => {
    cy.get('#top_align').click();
    checkGripPosition('s', 150, 100);
  });

  it('middle align', () => {
    cy.get('#middle_align').click();
    checkGripPosition('se', 250, 175);
  });

  it('bottom align', () => {
    cy.get('#bottom_align').click();
    checkGripPosition('n', 150, 200);
  });

  it('left align', () => {
    cy.get('#left_align').click();
    checkGripPosition('e', 100, 150);
  });

  it('center align', () => {
    cy.get('#center_align').click();
    checkGripPosition('sw', 125, 250);
  });

  it('right align', () => {
    cy.get('#right_align').click();
    checkGripPosition('w', 200, 150);
  });

  it('hdist of distribute', () => {
    cy.get('#hdist').click();
    cy.clickToolBtn('Cursor');
    cy.get('#svg_2').click({ force: true });
    checkGripPosition('se', 175, 200);
  });

  it('vdist of distribute', () => {
    cy.get('#vdist').click();
    cy.clickToolBtn('Cursor');
    cy.get('#svg_2').click({ force: true });
    checkGripPosition('nw', 150, 125);
  });
});
