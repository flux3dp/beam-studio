const zoomBlockPrefix = '_-_-packages-core-src-web-app-components-common-ZoomBlock-module_';
const zoomRatioText = () => cy.get(`[class*="${zoomBlockPrefix}_ratio"]`);

it('zoom in/out', () => {
  cy.landingEditor();
  cy.get(`[class*="${zoomBlockPrefix}_container"]`).should('exist');
  cy.get(`[class*="${zoomBlockPrefix}_container"] img[src="img/icon-minus.svg"]`).parent().should('exist');
  cy.get(`[class*="${zoomBlockPrefix}_container"] img[src="img/icon-plus.svg"]`).parent().should('exist');

  let zoomRatio;
  zoomRatioText().should(($div) => {
    zoomRatio = parseInt($div.text().replace('%', ''));
  });

  cy.get(`[class*="${zoomBlockPrefix}_container"] img[src="img/icon-plus.svg"]`).parent().click();
  zoomRatioText().should(($div) => {
    expect(parseInt($div.text().replace('%', '')) > zoomRatio).to.be.true;
    zoomRatio = parseInt($div.text().replace('%', ''));
  });

  cy.get(`[class*="${zoomBlockPrefix}_container"] img[src="img/icon-minus.svg"]`).parent().click();
  zoomRatioText().should(($div) => {
    expect(parseInt($div.text().replace('%', '')) < zoomRatio).to.be.true;
  });
});
