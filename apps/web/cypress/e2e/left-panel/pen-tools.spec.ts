describe('pen tools', () => {
  beforeEach(() => {
    cy.landingEditor();
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
    cy.get('svg#svgcontent').dblclick({ force: true });
    cy.get('#svg_1', { timeout: 7000 }).should('exist');
    cy.get('#drawingCtrlPoint_0c2').should('exist');
  });

  it('path curve', () => {
    cy.get('#pathpointgrip_0').first().should(($grip) => { expect($grip.attr('cx')).to.be.closeTo(100, 1); });
    cy.get('#pathpointgrip_0').first().should(($grip) => { expect($grip.attr('cy')).to.be.closeTo(100, 1); });
    cy.get('#pathpointgrip_1').first().should(($grip) => { expect($grip.attr('cx')).to.be.closeTo(250, 1); });
    cy.get('#pathpointgrip_0').first().should(($grip) => { expect($grip.attr('cy')).to.be.closeTo(100, 1); });
  });

  it('path nodetype corner', () => {
    cy.get('#pathpointgrip_3', { timeout: 7000 }).dblclick();
    cy.get('#pathedit-panel').should('exist');
    cy.get('[title="Corner"]').click();
    cy.get('#ctrlpointgrip_4c1')
      .trigger('mousedown', { which: 1, pageX: 50, pageY: 50 })
      .trigger('mousemove', { which: 1, pageX: 100, pageY: 400 })
      .trigger('mouseup');

    cy.get('#ctrlpointgrip_4c1').first().should(($grip) => { expect($grip.attr('cx')).to.be.closeTo(650, 1); });
    cy.get('#ctrlpointgrip_4c1').first().should(($grip) => { expect($grip.attr('cy')).to.be.closeTo(400, 1); });
    cy.get('#ctrlpointgrip_3c2').first().should(($grip) => { expect($grip.attr('cx')).to.be.closeTo(400, 1); });
    cy.get('#ctrlpointgrip_3c2').first().should(($grip) => { expect($grip.attr('cy')).to.be.closeTo(550, 1); });
  });

  it('path nodetype smooth', () => {
    cy.get('#pathpointgrip_3', { timeout: 7000 }).dblclick();
    cy.get('#pathedit-panel').should('exist');
    cy.get('[title="Smooth"]').click();
    cy.get('#ctrlpointgrip_4c1')
      .trigger('mousedown', { which: 1, pageX: 50, pageY: 50 })
      .trigger('mousemove', { which: 1, pageX: 100, pageY: 400 })
      .trigger('mouseup');

    cy.get('#ctrlpointgrip_4c1').first().should(($grip) => { expect($grip.attr('cx')).to.be.closeTo(650, 1); });
    cy.get('#ctrlpointgrip_4c1').first().should(($grip) => { expect($grip.attr('cy')).to.be.closeTo(400, 1); });
    cy.get('#ctrlpointgrip_3c2').first().should(($grip) => { expect($grip.attr('cx')).to.be.closeTo(277, 1); });
    cy.get('#ctrlpointgrip_3c2').first().should(($grip) => { expect($grip.attr('cy')).to.be.closeTo(151, 1); });
  });

  it('path nodetype symmetry', () => {
    cy.get('#pathpointgrip_3', { timeout: 7000 }).dblclick();
    cy.get('#pathedit-panel').should('exist');
    cy.get('#ctrlpointgrip_4c1')
      .trigger('mousedown', { which: 1, pageX: 50, pageY: 50 })
      .trigger('mousemove', { which: 1, pageX: 100, pageY: 400 })
      .trigger('mouseup');
    cy.get('#ctrlpointgrip_4c1').first().should(($grip) => { expect($grip.attr('cx')).to.be.closeTo(650, 1); });
    cy.get('#ctrlpointgrip_4c1').first().should(($grip) => { expect($grip.attr('cy')).to.be.closeTo(400, 1); });
    cy.get('#ctrlpointgrip_3c2').first().should(($grip) => { expect($grip.attr('cx')).to.be.closeTo(350, 1); });
    cy.get('#ctrlpointgrip_3c2').first().should(($grip) => { expect($grip.attr('cy')).to.be.closeTo(200, 1); });
  });
});
