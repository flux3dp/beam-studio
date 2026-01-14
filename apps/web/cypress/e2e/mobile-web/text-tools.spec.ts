describe('mobile text tools', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
    cy.get('.adm-tab-bar-item').contains('Text').click();
    cy.get('svg#svgcontent').dblclick(300, 200);
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('{backspace}{backspace}{backspace}{backspace}TEST TEXT FONT');
    cy.get('#svg_1').should('have.text', 'TEST TEXT FONT');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.get('div#object-panel').should('exist');
    cy.get('#font_family').click();
    cy.get(
      '[class*="src-web-app-views-beambox-Right-Panels-ObjectPanelItem-module__option"] img[alt="Noto Sans"]',
    ).click();
  });

  it('check font family', () => {
    cy.get('#svg_1').should('have.attr', 'font-family', "'Noto Sans'");
  });

  it('text style', () => {
    cy.get('#font_style').click();
    cy.contains('Italic').click();
    cy.get('#svg_1').should('have.attr', 'font-style').and('eq', 'italic');
  });

  it('text size', () => {
    cy.get('#font_size').click();
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('1').click({ force: true });
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('0').click({ force: true });
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('0').click({ force: true });
    cy.get('#svg_1').should('have.attr', 'font-size').and('eq', '100');
  });

  it('text letter spacing', () => {
    cy.get('#letter_spacing').click();
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('0').click({ force: true });
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('.').click({ force: true });
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('1').click({ force: true });
    cy.get('#svg_1').should('have.attr', 'letter-spacing').and('eq', '0.1em');
  });

  it('line spacing', () => {
    cy.get('#svg_1').dblclick({ force: true });
    cy.realPress(['Shift', 'Enter']);
    cy.inputText('LINE SPACING TEST{enter}');
    cy.get('#svg_1').should('include.text', 'LINE SPACING TEST');
    cy.get('#line_spacing').click();
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('1').click({ force: true });
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('.').click({ force: true });
    cy.get('[class="adm-button adm-button-default adm-button-shape-rounded"]').contains('5').click({ force: true });
    cy.get('#svg_1').should('have.attr', 'data-line-spacing').and('eq', '1.5');
  });

  it('vertical', () => {
    cy.get('#vertical-text').click();
    cy.get('#svg_1').should('have.attr', 'data-verti').and('eq', 'true');
  });

  it('infill', () => {
    cy.get('#svg_1').should('have.attr', 'fill').and('not.eq', 'none');
    cy.get('#infill').click();
    cy.get('#svg_1').should('have.attr', 'fill').and('eq', 'none');
  });
});
