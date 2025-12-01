describe('pen tools', () => {
  // 1. Define helper functions right inside the test suite.
  const drawComplexPenPath = () => {
    cy.clickToolBtn('Pen');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 150, 150, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, -50, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 250, 20, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 400, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 500, -50, { force: true });
    cy.get('#drawingCtrlPoint_0c2').should('exist');
    cy.get('svg#svgcontent').dblclick({ force: true });
    cy.get('#svg_1', { timeout: 7000 }).should('exist');
  };

  const assertPointPosition = (selector: string, x: number, y: number) => {
    cy.get(selector)
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(x, 1);
        expect($grip.attr('cy')).to.be.closeTo(y, 1);
      });
  };

  // 2. Set up the initial state for all tests.
  beforeEach(() => {
    cy.landingEditor();
    drawComplexPenPath();
  });

  // 3. Keep unique tests as they are, but use the helper.
  it('should correctly render the initial path curve', () => {
    assertPointPosition('#pathpointgrip_0', 100, 100);
    assertPointPosition('#pathpointgrip_1', 250, 250);
  });

  // 4. Group similar tests into a data array and loop through them.
  const nodeTypeTests = [
    { type: 'Corner', expected: { c1x: 650, c1y: 400, c2x: 400, c2y: 539 } },
    { type: 'Smooth', expected: { c1x: 650, c1y: 400, c2x: 285, c2y: 142 } },
    { type: 'Symmetry', expected: { c1x: 650, c1y: 400, c2x: 350, c2y: 188 } },
  ];

  nodeTypeTests.forEach((test) => {
    it(`should handle path nodetype: ${test.type}`, () => {
      cy.get('#pathpointgrip_3').dblclick();
      cy.get('#pathedit-panel').should('exist');

      // The "Symmetry" test doesn't click a button, it's the default.
      if (test.type !== 'Symmetry') {
        cy.get(`[title="${test.type}"]`).click();
      }

      cy.get('#ctrlpointgrip_4c1')
        .trigger('mousedown', { which: 1, pageX: 50, pageY: 50 })
        .trigger('mousemove', { which: 1, pageX: 100, pageY: 400 })
        .trigger('mouseup');

      assertPointPosition('#ctrlpointgrip_4c1', test.expected.c1x, test.expected.c1y);
      assertPointPosition('#ctrlpointgrip_3c2', test.expected.c2x, test.expected.c2y);
    });
  });
});
