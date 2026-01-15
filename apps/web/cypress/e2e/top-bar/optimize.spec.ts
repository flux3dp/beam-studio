it('arrangement', () => {
  cy.landingEditor();
  cy.clickToolBtn('Rectangle');
  cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
  cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
  cy.get('svg#svgcontent').trigger('mouseup', { force: true });

  cy.get('#svg_1').click({ force: true });
  cy.get('.tab.objects').click();
  cy.contains('Smart Nest').click();
  // Fixme: svgNest will failed in e2e
  cy.contains('Arrange');
  // cy.get('div[class*="src-web-app-views-beambox-SvgNestButtons-module__container"] > button.ant-btn-primary').click();
  // cy.wait(10000);
  // cy.get('div[class*="src-web-app-views-beambox-SvgNestButtons-module__container"] > button.ant-btn-primary').should('have.text', 'Stop');
  // cy.get('#svg_1').should(($location) => {
  //   const xLocation = $location.attr('x');
  //   const yLocation = $location.attr('y');
  //   expect(xLocation.toString().substring(0, 6)).equal('-0.000');
  //   expect(yLocation.toString().substring(0, 6)).equal('0.0000');
  // });
});
