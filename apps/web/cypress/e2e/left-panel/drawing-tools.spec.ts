const drawingTools = ['Cursor', 'Text', 'Rectangle', 'Ellipse', 'Polygon', 'Line', 'Pen'];

function checkActive(activeItem: string) {
  drawingTools.forEach((item) => {
    cy.checkToolBtnActive(item, item === activeItem);
  });
}

it('check the existence of the left toolbar and default active tool', () => {
  cy.landingEditor();

  cy.get('div[class*="src-web-app-components-beambox-LeftPanel-index-module__container"]').should('exist');
  checkActive('Cursor');

  drawingTools.forEach((tool) => {
    cy.clickToolBtn(tool);
    checkActive(tool);
  });
});
