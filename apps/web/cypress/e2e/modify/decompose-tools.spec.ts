import { md5 } from '../../support/utils';

it('decompose', () => {
  cy.landingEditor();
  cy.clickToolBtn('Element', false);
  cy.get('.ant-drawer-header').contains('Element').should('exist');
  cy.get('.anticon[id="basic/icon-tablet"]').click();
  cy.get('.ant-drawer-header').should('not.exist');
  cy.get('#svg_1').should('exist').should('have.attr', 'fill', '#333333');
  cy.get('#svg_1').click({ force: true });
  cy.showPanel('objects');
  cy.setInfill(false);
  cy.get('button#decompose_path').click();
  cy.get('#svg_2').should('exist').should('have.attr', 'stroke', '#333333').should('have.attr', 'fill-opacity', '0');
  cy.get('#svg_2')
    .invoke('attr', 'd')
    .then((html) => expect(md5(html!)).equal('12c7c1dd2998f078a1ebc878fac94d28'));
  cy.get('#svg_3').should('exist').should('have.attr', 'stroke', '#333333').should('have.attr', 'fill-opacity', '0');
  cy.get('#svg_3')
    .invoke('attr', 'd')
    .then((html) => expect(md5(html!)).equal('67f66437d35cb43304bd3e946edd24af'));
});
