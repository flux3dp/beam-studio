describe('select tools', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('select', () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 });
    cy.wait(500);
    cy.inputText('TEST SELECT');
    cy.get('#svg_1').should('exist');
    cy.clickToolBtn('Cursor');
    cy.get('#svg_1').realClick();
    cy.window().then((win) => {
      const el = win.eval('svgCanvas.getSelectedElems()');
      cy.get(el).should('length', '1');
      cy.get(el).should('id', 'svg_1');
    });
  });

  it('mutil select', () => {
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 50, 50, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist');
    cy.clickToolBtn('Ellipse');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 150, 150, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_2').should('exist');
    cy.clickToolBtn('Cursor');
    cy.get('svg#svgcontent').trigger('mousedown', -10, -10, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 300, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.findAllByText('Multiple Objects').should('exist');
    cy.window().then((win) => {
      const el = win.eval('svgCanvas.getTempGroup()');
      const childNodes = Array.from(el.childNodes);
      expect(childNodes).to.have.length(2);
      expect(childNodes[0]).to.have.id('svg_1');
      expect(childNodes[1]).to.have.id('svg_2');
    });
  });

  it('select rotate', () => {
    cy.clickToolBtn('Element');
    cy.get('[class="ant-modal-header"]').contains('Element').should('exist');
    cy.get('[class="ant-modal-body"]').should('exist');
    cy.get('[class="adm-capsule-tabs-tab adm-capsule-tabs-tab-active"]').should('exist');
    cy.get('.anticon[id="basic/icon-triangle"]').click();
    cy.get('#svg_1').click();
    cy.get('circle#selectorGrip_rotate')
      .trigger('mousedown', { which: 1, force: true })
      .trigger('mousemove', { which: 1, pageX: 150, pageY: 50, shiftKey: true, force: true })
      .trigger('mouseup', { force: true });
    cy.get('#svg_1')
      .should('exist')
      .invoke('attr', 'transform')
      .then((transform) => {
        expect(transform).to.satisfy((t: string) => t.match(/rotate\(45 [\d.]+,[\d.]+\)/));
      });
    cy.get('#svg_1').click();
    cy.get('circle#selectorGrip_rotate')
      .trigger('mousedown', { which: 1, force: true })
      .trigger('mousemove', { which: 1, pageX: 200, pageY: 100, shiftKey: true, force: true })
      .trigger('mouseup', { force: true });
    cy.get('#svg_1')
      .invoke('attr', 'transform')
      .then((transform) => {
        expect(transform).to.satisfy((t: string) => t.match(/rotate\(90 [\d.]+,[\d.]+\)/));
      });
    cy.get('#svg_1').click();
    cy.get('circle#selectorGrip_rotate')
      .trigger('mousedown', { which: 1, force: true })
      .trigger('mousemove', { which: 1, pageX: 200, pageY: 200, shiftKey: true, force: true })
      .trigger('mouseup', { force: true });
    cy.get('#svg_1')
      .invoke('attr', 'transform')
      .then((transform) => {
        expect(transform).to.satisfy((t: string) => t.match(/rotate\(135 [\d.]+,[\d.]+\)/));
      });
    cy.get('#svg_1').click();
    cy.get('circle#selectorGrip_rotate')
      .trigger('mousedown', { which: 1, force: true })
      .trigger('mousemove', { which: 1, pageX: 200, pageY: 300, shiftKey: true, force: true })
      .trigger('mouseup', { force: true });

    cy.get('#svg_1')
      .invoke('attr', 'transform')
      .then((transform) => {
        expect(transform).to.satisfy((t: string) => t.match(/rotate\(-180 [\d.]+,[\d.]+\)/));
      });
  });
});
