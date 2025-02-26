import { md5 } from '../../support/utils';

const shapePanelPrefix = '_-_-packages-core-src-web-app-views-beambox-ShapePanel-ShapeIcon-module__';

describe('mobile element tools', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
  });

  it('import ellipse element', () => {
    cy.get('.adm-tab-bar-item').contains('Element').click();
    cy.get('[class*="src-web-app-widgets-FloatingPanel-module__title--"]').contains('Element').should('exist');
    cy.get(`.anticon[class*="${shapePanelPrefix}icon--"]`).eq(0).click();
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
    cy.get(`.anticon[class*="${shapePanelPrefix}icon--"]`).eq(0).click();
    cy.get('#svg_9').should('exist').should('have.attr', 'fill', '#333333');
    cy.get('#svg_9')
      .invoke('attr', 'd')
      .then((html) => expect(md5(html)).equal('7e57d924a29e7ad9272398d9e6595eec'));
    cy.get('#selectorGrip_rotate_bottom').should('be.visible');
    cy.get('#selectorGrip_dimension_info').should('be.visible').should('have.text', '50mm x 38.3mm');
  });
});
