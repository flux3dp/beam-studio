describe('mobile pen tools', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
    cy.get('.adm-tab-bar-item').contains('Pen').click();
    // Wait for pen tool to be active
    cy.get('g#selectorParentGroup').should('have.css', 'cursor', 'crosshair');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 150, 150, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, -50, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 250, 20, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').trigger('mousedown', 400, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 500, -50, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#drawingCtrlPoint_0c2').should('exist');
    cy.get('svg#svgcontent').dblclick({ force: true });
    cy.get('#svg_1', { timeout: 7000 }).should('exist');
    cy.get('.adm-floating-panel').contains('Path Edit').should('exist');
  });

  it('path curve', () => {
    cy.get('#pathpointgrip_0')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(100, 1);
      });
    cy.get('#pathpointgrip_0')
      .first()
      .should(($grip) => {
        expect($grip.attr('cy')).to.be.closeTo(100, 1);
      });
    cy.get('#pathpointgrip_1')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(250, 1);
      });
    cy.get('#pathpointgrip_0')
      .first()
      .should(($grip) => {
        expect($grip.attr('cy')).to.be.closeTo(100, 1);
      });

    cy.get('#svgroot').dblclick({ force: true });
    cy.get('.adm-floating-panel').contains('Path Edit').should('not.exist');
  });

  it('path corner', () => {
    cy.get('.ant-btn[title="Symmetry"]').invoke('attr', 'class').should('not.contain', 'active');
    cy.get('#pathpointgrip_3').click({ force: true });
    cy.get('.ant-btn[title="Symmetry"]').invoke('attr', 'class').should('contain', 'active');
    cy.get('[title="Corner"]').click();
    cy.get('.ant-btn[title="Symmetry"]').invoke('attr', 'class').should('not.contain', 'active');
    cy.get('.ant-btn[title="Corner"]').invoke('attr', 'class').should('contain', 'active');
    cy.get('#ctrlpointgrip_4c1')
      .trigger('mousedown', { which: 1, pageX: 50, pageY: 50, force: true })
      .trigger('mousemove', { which: 1, pageX: 100, pageY: 400, force: true })
      .trigger('mouseup', { force: true });
    cy.get('#ctrlpointgrip_4c1')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(650, 1);
      });
    cy.get('#ctrlpointgrip_4c1')
      .first()
      .should(($grip) => {
        expect($grip.attr('cy')).to.be.closeTo(400, 1);
      });
    cy.get('#ctrlpointgrip_3c2')
      .first()
      .should(($grip) => {
        expect($grip.attr('cx')).to.be.closeTo(400, 1);
      });
    cy.get('#ctrlpointgrip_3c2')
      .first()
      .should(($grip) => {
        expect($grip.attr('cy')).to.be.closeTo(550, 1);
      });

    cy.get('#svgroot').dblclick({ force: true });
    cy.get('.adm-floating-panel').contains('Path Edit').should('not.exist');
  });
});
