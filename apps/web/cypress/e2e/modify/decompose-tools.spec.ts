import { md5 } from '../../support/utils';

it('decompose', () => {
  cy.landingEditor();
  cy.clickToolBtn('Element');
  cy.get('[class="ant-modal-header"]').contains('Element').should('exist');
  cy.get('.anticon[id="basic/icon-tablet"]').click();
  cy.get('[class="ant-modal-header"]').should('not.exist');
  cy.get('#svg_9').should('exist').should('have.attr', 'fill', '#333333');
  cy.get('#svg_9').click({ force: true });
  cy.get('.tab.objects').click();
  cy.get('button#infill').click();
  cy.get('button#decompose_path').click();
  cy.get('#svg_10').should('exist').should('have.attr', 'stroke', '#333333').should('have.attr', 'fill-opacity', '0');
  cy.get('#svg_10')
    .invoke('attr', 'd')
    .then((html) => expect(md5(html)).equal('87c26b3041b47d93d567c53dad9f6a19'));
  cy.get('#svg_11').should('exist').should('have.attr', 'stroke', '#333333').should('have.attr', 'fill-opacity', '0');
  cy.get('#svg_11')
    .invoke('attr', 'd')
    .then((html) => expect(md5(html)).equal('45c6abed57f25fae18965699d89bc4d2'));
});
