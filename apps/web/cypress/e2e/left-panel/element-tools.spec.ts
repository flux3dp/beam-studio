import { md5 } from '../../support/utils';

const shapeIconPrefix = '_-_-packages-core-src-web-app-views-beambox-ShapePanel-ShapeIcon-module__';

describe('import from element panel', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('import ellipse element', () => {
    cy.clickToolBtn('Element');
    cy.get('.ant-modal-header').contains('Element').should('exist');
    cy.get('.ant-modal-body').should('exist');
    cy.get('.adm-capsule-tabs-tab.adm-capsule-tabs-tab-active').should('exist');
    cy.get('.adm-capsule-tabs-tab.adm-capsule-tabs-tab-active').should('have.text', 'Basic');
    cy.get('.anticon[id="basic/icon-circle"]').click();
    cy.get('#svg_1').should('exist');
    cy.get('#svg_1').should('have.attr', 'cx', '250');
    cy.get('#svg_1').should('have.attr', 'cy', '250');
    cy.get('#svg_1').should('have.attr', 'fill', '#333333');
  });

  it('switch tab and import svg element', () => {
    cy.clickToolBtn('Element');
    cy.get('.adm-capsule-tabs-tab-wrapper').contains('Decor').click();
    cy.get('.adm-capsule-tabs-tab.adm-capsule-tabs-tab-active').should('exist');
    cy.get('.adm-capsule-tabs-tab.adm-capsule-tabs-tab-active').should('have.text', 'Decor');
    cy.get('.anticon[id="decor/i_circular-1"]').eq(0).click();
    cy.get('#svg_9').should('exist');
    cy.get('#svg_9').should('have.attr', 'fill', '#333333');
    cy.get('#svg_9')
      .invoke('attr', 'd')
      .then((html) => expect(md5(html)).equal('df2c88105c672bb740c0ebd9ee1f0e88'));
  });
});
