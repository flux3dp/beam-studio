import { md5 } from '../../support/utils';

it('decompose', () => {
  cy.landingEditor();
  cy.clickToolBtn('Element');
  cy.get('[class="ant-modal-header"]').contains('Element').should('exist');
  cy.get('.anticon[class*="src-web-app-views-beambox-ShapePanel-ShapeIcon-module__icon"]')
    .eq(12)
    .click();
  cy.get('[class="ant-modal-header"]').should('not.exist');
  cy.get('#svg_9').should('exist').should('have.attr', 'fill', '#333333');
  cy.get('#svg_9').click({ force: true });
  cy.get('.tab.objects').click();
  cy.get('button#infill').click();
  cy.get('button#decompose_path').click();
  cy.get('#svg_10')
    .should('exist')
    .should('have.attr', 'stroke', '#333333')
    .should('have.attr', 'fill-opacity', '0');
  cy.get('#svg_10')
    .invoke('attr', 'd')
    .then((html) => expect(md5(html)).equal('8adbbcb5a207463d0136b5663d2fdac4'));
  cy.get('#svg_11')
    .should('exist')
    .should('have.attr', 'stroke', '#333333')
    .should('have.attr', 'fill-opacity', '0');
  cy.get('#svg_11')
    .invoke('attr', 'd')
    .then((html) => expect(md5(html)).equal('3409b5416f79d80ef671eac0c95a66c1'));
});
