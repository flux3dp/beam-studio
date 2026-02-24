describe('manipulate view', () => {
  const isRunningAtGithub = Cypress.env('envType') === 'github';
  const addLayerBtnPrefix = '_-_-packages-core-src-web-app-components-beambox-RightPanel-AddLayerButton-module__btn';
  const zoomBlockPrefix = '_-_-packages-core-src-web-app-components-common-ZoomBlock-module_';
  const zoomRatio = () => cy.get(`[class*="${zoomBlockPrefix}_ratio"]`);

  beforeEach(() => {
    cy.landingEditor();
  });

  it('top menu - zoom in ', () => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__submenu').contains('View').click();
    cy.get('.szh-menu').contains('Zoom In').click();
    zoomRatio().should('have.text', '46%');
  });

  it('top menu - zoom out', () => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__submenu').contains('View').click();
    cy.get('.szh-menu').contains('Zoom Out').click();
    zoomRatio().should('have.text', '38%');
  });

  it('top menu - fit to window size', () => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__submenu').contains('View').click();
    cy.get('.szh-menu').contains('Fit to Window Size').click();
    zoomRatio().should('have.text', '42%');
  });

  it('auto fit to window size', () => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__submenu').contains('View').click();
    cy.get('.szh-menu').contains('Auto Fit to Window Size').click();
    zoomRatio().should('have.text', '42%');
    cy.viewport(1500, 1200);
    const targetValue = Cypress.platform === 'win32' ? '75%' : '76%';
    zoomRatio().should('have.text', targetValue);
  });

  it('show grids', () => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__submenu').contains('View').click();
    cy.get('.szh-menu').contains('Show Grids').should('have.attr', 'aria-checked', 'true');
    cy.get('#canvasGrid').then((elem) => {
      expect(elem.css('display')).equal('inline');
    });
  });

  it('show rulers', () => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__submenu').contains('View').click();
    cy.get('.szh-menu').contains('Show Rulers').click();
    cy.get('#ruler_x').should('exist');
    cy.get('#ruler_y').should('exist');
  });

  it('use layer color', () => {
    cy.get(`button[class*="${addLayerBtnPrefix}"]`).click({ force: true });
    cy.get('div[class*="src-web-app-widgets-ColorPicker-module__color"]').should(
      'have.attr',
      'style',
      'background: rgb(63, 81, 181);',
    );
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('have.attr', 'stroke', '#3F51B5');
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__submenu').contains('View').click();
    cy.get('.szh-menu').contains('Use Layer Color').click({ force: true });
    cy.get('#svg_1').should('have.attr', 'stroke', '#000');
  });

  it('anti aliasing', () => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.get('.szh-menu__submenu').contains('View').click();
    cy.get('.szh-menu').contains('Anti-Aliasing').should('have.attr', 'aria-checked', 'true');
    cy.clickToolBtn('Ellipse');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 200, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('svg#svgcontent').should(($shapeRendering) => {
      const str = $shapeRendering.attr('style');
      expect(str.substring(50)).equal('');
    });
  });
});
