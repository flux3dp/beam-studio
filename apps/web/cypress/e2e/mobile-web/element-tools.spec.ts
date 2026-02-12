import { md5 } from '../../support/utils';

describe('mobile element tools', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
  });

  it('import ellipse element', () => {
    cy.get('.adm-tab-bar-item').contains('Element').click();
    cy.get('[class*="src-web-app-widgets-FloatingPanel-module__title--"]').contains('Element').should('exist');
    cy.get(`.anticon[id="basic/icon-circle"]`).eq(0).click();
    cy.get('#svg_1').should('exist');
    cy.get('#svg_1').should('have.attr', 'cx', '250');
    cy.get('#svg_1').should('have.attr', 'cy', '250');
    cy.get('#svg_1').should('have.attr', 'fill', '#333333');
    cy.get('#selectorGrip_rotate_bottom').should('be.visible');
    cy.get('#selectorGrip_dimension_info').should('be.visible').should('have.text', '50mm x 50mm');
  });

  it('import svg element', () => {
    cy.get('.adm-tab-bar-item').contains('Element').click();
    cy.get('.adm-capsule-tabs-tab-wrapper').contains('Decor').click();
    cy.get(`.anticon[id="decor/i_circular-1"]`).eq(0).click();
    cy.get('#svg_9').should('exist').should('have.attr', 'fill', '#333333');
    cy.get('#svg_9')
      .invoke('attr', 'd')
      .then((html) => expect(md5(html)).equal('3224b6b40f3f204d1e60083ead786c5a'));
    cy.get('#selectorGrip_rotate_bottom').should('be.visible');
    cy.get('#selectorGrip_dimension_info').should('be.visible').should('have.text', '50mm x 38.3mm');
  });
});
