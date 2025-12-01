import { md5 } from '../../support/utils';

it('decompose', () => {
  cy.landingEditor();
  cy.clickToolBtn('Element', false);
  cy.get('.ant-drawer-header').contains('Element').should('exist');
  cy.get('.anticon[id="basic/icon-tablet"]').click();
  cy.get('.ant-drawer-header').should('not.exist');
  cy.get('#svg_9').should('exist').should('have.attr', 'fill', '#333333');
  cy.get('#svg_9').click({ force: true });
  cy.get('.tab.objects').click();
  cy.get('button#infill').click();
  cy.get('button#decompose_path').click();
  cy.get('#svg_10').should('exist').should('have.attr', 'stroke', '#333333').should('have.attr', 'fill-opacity', '0');
  cy.get('#svg_10')
    .invoke('attr', 'd')
    .then((html) => expect(md5(html)).equal('cad5d92b09202d2abe2e31be39850f01'));
  cy.get('#svg_11').should('exist').should('have.attr', 'stroke', '#333333').should('have.attr', 'fill-opacity', '0');
  cy.get('#svg_11')
    .invoke('attr', 'd')
    .then((html) => expect(md5(html)).equal('1f3448b535eb92bb9d53da853fa5de26'));
});
