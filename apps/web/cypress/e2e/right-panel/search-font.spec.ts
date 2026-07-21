describe('search font', () => {
  beforeEach(() => {
    cy.landingEditor();
    drawText();
  });

  // Fonts that are always bundled in the web build (see
  // packages/core/src/web/helpers/fonts/webFonts.ts), so search results are
  // deterministic without FLUXGhost or the Google Fonts network API.
  const searchedFont = 'Mr Bedfort';
  const otherFont = 'Noto Sans';

  const fontSelect = () => cy.get('.ant-select[title="Font"]');
  const openDropdown = () => {
    fontSelect().click();
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').should('exist');
  };
  // The Antd combobox search input is a 4px position:fixed element that Cypress
  // reports as visually covered, so type with { force: true }.
  const searchFont = (query: string) =>
    fontSelect().find('input.ant-select-selection-search-input').type(query, { force: true });

  function drawText() {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 100 });
    // Wait for text element to be created
    cy.get('#svg_1').should('exist');
    cy.inputText('SEARCH FONT');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.showPanel('objects');
    cy.get('div#object-panel').should('exist');
  }

  it('filters the font list to fonts matching the search query', () => {
    openDropdown();
    // Both fonts present before searching.
    cy.get(`.ant-select-item-option img[alt="${searchedFont}"]`).should('exist');
    cy.get(`.ant-select-item-option img[alt="${otherFont}"]`).should('exist');

    searchFont(searchedFont);

    // Matching font remains, non-matching font is filtered out.
    cy.get(`.ant-select-item-option img[alt="${searchedFont}"]`).should('be.visible');
    cy.get(`.ant-select-item-option img[alt="${otherFont}"]`).should('not.exist');
  });

  it('selecting a searched font updates the text element font-family', () => {
    openDropdown();
    searchFont(searchedFont);
    cy.get(`.ant-select-item-option img[alt="${searchedFont}"]`).should('be.visible').click();

    // Dropdown closes after selection.
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').should('not.exist');
    cy.get('#svg_1').should('have.attr', 'font-family').and('eq', "'Mr Bedfort'");
    // Selected value is reflected in the Font select display.
    fontSelect().find('.ant-select-selection-item img').should('have.attr', 'alt', searchedFont);
  });

  it('shows an empty result state for a nonsense query', () => {
    openDropdown();
    searchFont('zzzzznotarealfont');

    // No font options match; Antd renders its empty placeholder.
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').should('not.exist');
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-empty').should('be.visible');
  });

  it('restores the full list when the dropdown is reopened', () => {
    openDropdown();
    searchFont('zzzzznotarealfont');
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').should('not.exist');

    // Close the dropdown, clearing the transient search query.
    cy.get('body').type('{esc}');
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').should('not.exist');

    // Reopening shows the full list again.
    openDropdown();
    cy.get('.ant-select-item-empty').should('not.exist');
    cy.get(`.ant-select-item-option img[alt="${searchedFont}"]`).should('exist');
    cy.get(`.ant-select-item-option img[alt="${otherFont}"]`).should('exist');
  });
});
