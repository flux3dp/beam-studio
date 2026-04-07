const canvasControlPrefix = '_-_-packages-core-src-web-app-components-beambox-SvgEditor-CanvasControl-module_';
const zoomRatioText = () => cy.get(`[class*="${canvasControlPrefix}_ratioDisplay"]`);

it('zoom in/out', () => {
  cy.landingEditor();
  cy.get(`[class*="${canvasControlPrefix}_container"]`).should('exist');
  cy.get(`[class*="${canvasControlPrefix}_actionBtn"]`).should('have.length', 2);

  let zoomRatio: number;
  zoomRatioText().should(($div) => {
    zoomRatio = parseInt($div.text().replace('%', ''));
  });

  cy.get(`[class*="${canvasControlPrefix}_actionBtn"]`).last().click();
  zoomRatioText().should(($div) => {
    expect(parseInt($div.text().replace('%', '')) > zoomRatio).to.be.true;
    zoomRatio = parseInt($div.text().replace('%', ''));
  });

  cy.get(`[class*="${canvasControlPrefix}_actionBtn"]`).first().click();
  zoomRatioText().should(($div) => {
    expect(parseInt($div.text().replace('%', '')) < zoomRatio).to.be.true;
  });
});
