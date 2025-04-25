import { md5 } from '../../support/utils';

describe('import from element panel', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('import ellipse element', () => {
    cy.clickToolBtn('Element');
    cy.get('.ant-drawer-header').contains('Element').should('exist');
    cy.get('.ant-drawer-body').should('exist');
    cy.get('.ant-drawer-header .ant-select-selection-item').should('exist');
    cy.get('.ant-drawer-header .ant-select-selection-item').should('have.text', 'Basic');
    cy.get('.anticon[id="basic/icon-circle"]').click();
    cy.get('#svg_1').should('exist');
    cy.get('#svg_1').should('have.attr', 'cx', '250');
    cy.get('#svg_1').should('have.attr', 'cy', '250');
    cy.get('#svg_1').should('have.attr', 'fill', '#333333');
  });

  it('switch tab and import svg element', () => {
    cy.clickToolBtn('Element');
    cy.get('.ant-drawer-header .ant-select-selector').click();
    cy.get('.ant-select-item-option').contains('Decor').click();
    cy.get('.ant-drawer-header .ant-select-selection-item').should('exist');
    cy.get('.ant-drawer-header .ant-select-selection-item').should('have.text', 'Decor');
    cy.get('.anticon[id="decor/i_circular-1"]').click();
    cy.get('#svg_9').should('exist');
    cy.get('#svg_9').should('have.attr', 'fill', '#333333');
    cy.get('#svg_9')
      .invoke('attr', 'd')
      .then((html) => expect(md5(html)).equal('df2c88105c672bb740c0ebd9ee1f0e88'));
  });
});
