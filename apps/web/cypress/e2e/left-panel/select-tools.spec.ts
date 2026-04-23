describe('select tools', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  function selectAndVerifyTool(tool, clickPosition, text) {
    cy.clickToolBtn(tool);
    cy.get('svg#svgcontent').realClick(clickPosition);

    if (text) cy.inputText(text);

    cy.get('#svg_1').should('exist');
  }

  it('select', () => {
    selectAndVerifyTool('Text', { x: 100, y: 200 }, 'TEST SELECT');

    cy.clickToolBtn('Cursor');
    cy.get('#svg_1').realClick();
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
  });

  it('multi select', () => {
    const drawShape = (tool: string, start: Record<'x' | 'y', number>, end: Record<'x' | 'y', number>) => {
      cy.clickToolBtn(tool);
      cy.get('svg#svgcontent')
        .trigger('mousedown', start.x, start.y, { force: true })
        .trigger('mousemove', end.x, end.y, { force: true })
        .trigger('mouseup', { force: true });
    };

    drawShape('Rectangle', { x: 50, y: 50 }, { x: 100, y: 100 });
    drawShape('Ellipse', { x: 100, y: 100 }, { x: 150, y: 150 });

    cy.get('#svg_1').should('exist');
    cy.get('#svg_2').should('exist');

    cy.clickToolBtn('Cursor');
    cy.get('svg#svgcontent')
      .trigger('mousedown', -10, -10, { force: true })
      .trigger('mousemove', 300, 300, { force: true })
      .trigger('mouseup', { force: true });

    cy.findAllByText('Multiple Objects').should('exist');
    cy.get('[data-tempgroup="true"]').should('exist');
    cy.get('[data-tempgroup="true"]').children().should('have.length', 2);
    cy.get('[data-tempgroup="true"]').children().first().should('have.id', 'svg_1');
    cy.get('[data-tempgroup="true"]').children().last().should('have.id', 'svg_2');
  });

  it('select rotate', () => {
    cy.clickToolBtn('Element', false);
    cy.get('.anticon[id="basic/icon-triangle"]').click();
    cy.get('.ant-drawer').should('not.exist');
    cy.get('#svg_1').click();

    const rotateAndVerify = (pageX: number, pageY: number, angle: number) => {
      cy.get('circle#selectorGrip_rotate')
        .trigger('mousedown', { which: 1, force: true })
        .trigger('mousemove', { which: 1, pageX, pageY, shiftKey: true, force: true })
        .trigger('mouseup', { force: true });

      cy.get('#svg_1')
        .invoke('attr', 'transform')
        .should((transform) => {
          expect(transform).to.match(new RegExp(`rotate\\(${angle} [\\d.]+[, ][\\d.]+\\)`));
        });
    };

    rotateAndVerify(175, 50, -45);
    rotateAndVerify(225, 100, 135);
    rotateAndVerify(225, 200, -180);
    rotateAndVerify(200, 300, -180);
  });
});
