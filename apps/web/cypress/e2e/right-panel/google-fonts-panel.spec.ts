// Google Fonts panel (release-test rows: 搜尋欄 / Language 下拉選單 / Category 類別 / Save / Cancel).
//
// The panel reaches the network in three places:
//   1. Metadata list  GET {FLUXID_HOST}/api/google-fonts  -> stubbed with a small fixed fixture
//      so search/filter results are deterministic.
//   2. Font CSS        GET https://fonts.googleapis.com/css2?...  (one <link> per previewed font)
//   3. Font binaries   GET https://fonts.gstatic.com/...  (TTF, only fetched on Select)
// We stub (1) and short-circuit (2)/(3) so nothing hits the real internet and no test depends on
// external availability. Network availability itself is derived purely from navigator.onLine, which
// is always true under Cypress, so the panel renders its normal (online) UI without extra wiring.
describe('google fonts panel', () => {
  const stubGoogleFonts = () => {
    cy.intercept('GET', '**/api/google-fonts', { fixture: 'google-fonts.json' }).as('googleFontsList');
    // Return an empty but valid stylesheet so the <link> onload fires (fonts "load" successfully).
    cy.intercept('GET', 'https://fonts.googleapis.com/css2**', {
      statusCode: 200,
      headers: { 'content-type': 'text/css' },
      body: '/* stubbed google font css */',
    }).as('fontCss');
    // Font binaries (only requested when a font is chosen for text editing).
    cy.intercept('GET', 'https://fonts.gstatic.com/**', { statusCode: 200, body: '' }).as('fontBinary');
  };

  beforeEach(() => {
    stubGoogleFonts();
    cy.landingEditor();
    drawText();
    openGoogleFontsPanel();
  });

  const fontSelect = () => cy.get('.ant-select[title="Font"]');

  // Card selector: FontPreview renders each font as <div data-font="<family>">.
  const fontCard = (family: string) => cy.get(`.ant-modal [data-font="${family}"]`);
  // The sidebar search is an Antd Select; typing drives the panel's searchText via onSearch.
  const searchInput = () => cy.get('.ant-modal').find('.ant-select-selection-search-input').first();
  const categoryChip = (label: string) => cy.get('.ant-modal button').contains(label);
  const saveButton = () => cy.get('.ant-modal .ant-btn-primary');
  const cancelButton = () => cy.get('.ant-modal .ant-btn').contains('Cancel');

  function drawText() {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 100 });
    cy.get('#svg_1').should('exist');
    cy.inputText('GOOGLE FONTS');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.showPanel('objects');
    cy.get('div#object-panel').should('exist');
  }

  // Opens the Font dropdown and clicks the "More Google Fonts..." button rendered inside the
  // dropdown's dropdownRender, then waits for the stubbed metadata to populate the list.
  function openGoogleFontsPanel() {
    fontSelect().click();
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').should('exist');
    cy.contains('More Google Fonts').click({ force: true });

    // Panel (DraggableModal) is open and the stubbed list has resolved into font cards.
    cy.get('.ant-modal').should('be.visible');
    cy.wait('@googleFontsList');
    fontCard('Alpha Sans').should('exist');
    fontCard('Beta Serif').should('exist');
  }

  it('filters the font list to fonts matching the search query', () => {
    // All fixture fonts present before searching.
    fontCard('Alpha Sans').should('exist');
    fontCard('Beta Serif').should('exist');
    fontCard('Gamma Sans').should('exist');

    searchInput().type('Beta', { force: true });

    // Only the matching font remains; non-matching families disappear.
    fontCard('Beta Serif').should('exist');
    fontCard('Alpha Sans').should('not.exist');
    fontCard('Gamma Sans').should('not.exist');
    fontCard('Delta Mono').should('not.exist');
  });

  it('shows an empty state for a nonsense search query', () => {
    searchInput().type('zzzzznotarealfont', { force: true });

    cy.get('.ant-modal [data-font]').should('not.exist');
    cy.get('.ant-modal').contains('No fonts found matching your search criteria.').should('be.visible');
  });

  it('filters the list by the Language dropdown', () => {
    // "Gamma Sans" is the only fixture font with the japanese subset.
    cy.get('.ant-modal').find('.ant-select').eq(1).click();

    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
      .contains('Japanese')
      .click({ force: true });

    fontCard('Gamma Sans').should('exist');
    fontCard('Alpha Sans').should('not.exist');
    fontCard('Beta Serif').should('not.exist');
    fontCard('Delta Mono').should('not.exist');
  });

  it('filters the list by Category', () => {
    // Toggle the "Serif" category chip: only serif fonts (Beta Serif) should remain.
    categoryChip('Serif').click();

    fontCard('Beta Serif').should('exist');
    fontCard('Alpha Sans').should('not.exist'); // sans-serif
    fontCard('Gamma Sans').should('not.exist'); // sans-serif
    fontCard('Delta Mono').should('not.exist'); // monospace

    // Toggling the same chip off restores the full list.
    categoryChip('Serif').click();
    fontCard('Alpha Sans').should('exist');
    fontCard('Gamma Sans').should('exist');
  });

  it('applies the selected font and closes the panel on Save', () => {
    // Save is disabled until a font card is selected.
    saveButton().should('be.disabled');

    fontCard('Beta Serif').click();
    cy.get('.ant-modal').contains('Beta Serif').should('exist');
    saveButton().should('not.be.disabled').click();

    // Panel closes and the chosen Google Font is applied to the text element.
    cy.get('.ant-modal').should('not.exist');
    cy.get('#svg_1').should('have.attr', 'font-family').and('include', 'Beta Serif');
    // The font becomes the current selection in the Font dropdown.
    fontSelect().should('contain.text', 'Beta Serif');
  });

  it('discards the selection and persists nothing on Cancel', () => {
    // Record the font-family before opening/selecting anything.
    cy.get('#svg_1')
      .invoke('attr', 'font-family')
      .then((before) => {
        fontCard('Beta Serif').click();
        cy.get('.ant-modal').contains('Beta Serif').should('exist');

        cancelButton().click();

        // Panel closes and the text element font-family is unchanged.
        cy.get('.ant-modal').should('not.exist');
        cy.get('#svg_1').should('have.attr', 'font-family', before as string);
      });
  });
});
