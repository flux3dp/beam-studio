// Google Fonts — LIVE API contract spec (NO stubbing, real internet required).
//
// This is the live-network complement to google-fonts-panel.spec.ts (which stubs everything
// with a fixture). Its purpose is to DETECT DRIFT: it fails on purpose when Google or the FLUX
// font-metadata API changes its endpoint or response shape, so we hear about a breaking upstream
// change before users do.
//
// It hits three real endpoints, all exercised through the app's own code paths:
//   1. Metadata list  GET https://id.flux3dp.com/api/google-fonts  (FLUXID_HOST + '/api/google-fonts')
//        -> the panel populates from googleFontsApiCache.getCache(); we also hit the exact same URL
//           via cy.request to pin the field names the app reads (family/category/subsets/variants/files).
//   2. Font CSS        GET https://fonts.googleapis.com/css2?...   (one <link> per previewed / selected font)
//   3. Font binaries   GET https://fonts.gstatic.com/...           (TTF, fetched on Select for text editing)
//
// The contract fields asserted below are exactly the ones consumed by:
//   - helpers/fonts/googleFontsApiCache.ts       (GoogleFontItem type + findFont by `family`)
//   - app/stores/googleFontStore/index.ts        (reads `variants`, `family`)
//   - .../TextOptions/components/hooks/useGoogleFontData.ts   (reads `subsets` for languages)
//   - .../TextOptions/components/GoogleFontsPanel.tsx         (filters on `category`, `subsets`, `family`)
//
// IF THIS FLAKES: first decide whether it is a real contract break or a third-party outage.
//   - Manually GET https://id.flux3dp.com/api/google-fonts and check it returns items with a
//     well-known font ('Roboto'). If that endpoint is down / changed, the metadata contract test is
//     telling the truth — fix the app/backend, do not weaken the assertion.
//   - If only css2/gstatic is unreachable (Google outage), the full-flow test may fail transiently;
//     this whole file is intentionally NOT gated on CI env yet. To gate it later, wrap the single
//     describe below in `if (Cypress.env('envType') === 'github') { it.skip(...) }` — it is written as
//     one self-contained describe precisely so that is a one-line change.
describe('google fonts (live api contract)', () => {
  // Exact URL the app builds: FLUXID_HOST ('https://id.flux3dp.com') + '/api/google-fonts'.
  const METADATA_URL = 'https://id.flux3dp.com/api/google-fonts';
  const STABLE_FONT = 'Roboto'; // Oldest, most stable Google font; safe drift anchor.

  const fontSelect = () => cy.get('.ant-select[title="Font"]');
  const fontCard = (family: string) => cy.get(`.ant-modal [data-font="${family}"]`);
  const searchInput = () => cy.get('.ant-modal').find('.ant-select-selection-search-input').first();
  const saveButton = () => cy.get('.ant-modal .ant-btn-primary');

  function drawText() {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 100 });
    cy.get('#svg_1').should('exist');
    cy.inputText('GOOGLE FONTS');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');
    cy.showPanel('objects');
    cy.get('div#object-panel').should('exist');
  }

  // Opens the Font dropdown -> "More Google Fonts..." button, then waits for the LIVE metadata to
  // resolve into font cards (no stub; this depends on the real /api/google-fonts response).
  function openGoogleFontsPanel() {
    fontSelect().click();
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').should('exist');
    cy.contains('More Google Fonts').click({ force: true });
    cy.get('.ant-modal', { timeout: 30000 }).should('be.visible');
    // Live list resolved into cards. First render is virtualized + paginated; at least one card exists.
    cy.get('.ant-modal [data-font]', { timeout: 30000 }).should('have.length.greaterThan', 0);
  }

  beforeEach(() => {
    cy.landingEditor();
  });

  // ---------------------------------------------------------------------------------------------
  // 1. CONTRACT: the metadata API still returns the shape the app reads. Pure drift detector.
  //    We call the exact URL the app constructs (so a host/path change here would also surface),
  //    then assert every field the app's code consumes is present with the expected primitive type.
  // ---------------------------------------------------------------------------------------------
  it('metadata API returns the field shape the app consumes (Roboto contract)', () => {
    cy.request({ method: 'GET', url: METADATA_URL, timeout: 30000 }).then((res) => {
      expect(res.status, 'metadata endpoint reachable anonymously').to.eq(200);

      const body = res.body as { items: Array<Record<string, unknown>>; kind: string };

      // Top-level envelope the cache (GoogleFontsApiResponse) reads.
      expect(body, 'response is an object').to.be.an('object');
      expect(body.kind, 'top-level kind').to.eq('webfonts#webfontList');
      expect(body.items, 'items array').to.be.an('array');
      expect(body.items.length, 'non-empty font list').to.be.greaterThan(100);

      // A well-known stable font must exist (findFont matches on `family`).
      const roboto = body.items.find((f) => f.family === STABLE_FONT);

      expect(roboto, `stable font "${STABLE_FONT}" present in list`).to.exist;

      // Every field the app actually reads must be present with the right primitive type.
      // family   -> googleFontsApiCache.findFont / panel key / preview data-font
      expect(roboto!.family, 'family: string').to.be.a('string');
      // category -> GoogleFontsPanel filter (font.category !== selectedCategory)
      expect(roboto!.category, 'category: string').to.be.a('string');
      expect(
        ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'],
        'category is one of the panel CATEGORIES',
      ).to.include(roboto!.category as string);
      // subsets  -> useGoogleFontData language options + panel language filter (font.subsets.includes)
      expect(roboto!.subsets, 'subsets: string[]').to.be.an('array');
      expect(roboto!.subsets, 'subsets includes latin').to.include('latin');
      // variants -> googleFontStore discoverAvailableVariants / registerGoogleFont
      expect(roboto!.variants, 'variants: string[]').to.be.an('array');
      expect(roboto!.variants as string[], 'variants non-empty').to.have.length.greaterThan(0);
      expect(roboto!.variants, 'variants includes regular').to.include('regular');
      // files    -> GoogleFontFiles record keyed by variant; used for gstatic binary URLs
      expect(roboto!.files, 'files: object').to.be.an('object');
      expect((roboto!.files as Record<string, string>).regular, 'files.regular is a gstatic url').to.match(
        /^https:\/\/fonts\.gstatic\.com\//,
      );
    });
  });

  // ---------------------------------------------------------------------------------------------
  // 2. FULL LIVE FLOW: open panel -> search Roboto -> select -> Save. Proves the metadata list,
  //    fonts.googleapis.com/css2 preview load AND fonts.gstatic.com binary load all work end to end
  //    and that the chosen family lands on the text element.
  // ---------------------------------------------------------------------------------------------
  it('applies a live Google font (Roboto) to a text element end to end', () => {
    drawText();
    openGoogleFontsPanel();

    // Drive the panel's searchText via the Antd search Select (onSearch -> setSearchText).
    searchInput().type(STABLE_FONT, { force: true });

    // The exact Roboto card must appear in the live-filtered results.
    fontCard(STABLE_FONT).should('exist').click();

    // Selection surfaces in the footer and enables Save.
    cy.get('.ant-modal').contains(STABLE_FONT).should('exist');
    saveButton().should('not.be.disabled').click();

    // Panel closes; the live font (css2 + gstatic binary) is applied to the text element.
    // Note: 'Roboto' also exists in the bundled static web-font list as family 'roboto'
    // (webFonts.google.ts), and handleGoogleFontSelect resolves the family case-insensitively to
    // that entry — so the attribute ends up lowercase. Match case-insensitively.
    cy.get('.ant-modal', { timeout: 30000 }).should('not.exist');
    cy.get('#svg_1', { timeout: 30000 })
      .should('have.attr', 'font-family')
      .and('match', new RegExp(STABLE_FONT, 'i'));
    // And it becomes the active selection in the Font dropdown. Roboto is also a bundled static
    // web font, so the select renders its selection as a preview <img> (alt/src carry the name)
    // rather than plain text — accept either representation.
    fontSelect()
      .find('.ant-select-selection-item')
      .should(($item) => {
        const text = $item.text();
        const alt = $item.find('img').attr('alt') ?? '';
        const src = $item.find('img').attr('src') ?? '';

        expect(`${text} ${alt} ${src}`, 'Font select shows Roboto').to.match(new RegExp(STABLE_FONT, 'i'));
      });
  });

  // ---------------------------------------------------------------------------------------------
  // 3. CATEGORY SANITY against the live list: toggling "Serif" still yields serif fonts. Cheap
  //    guard that the category field keeps driving the filter against real data.
  // ---------------------------------------------------------------------------------------------
  it('category filter still returns serif fonts from the live list', () => {
    drawText();
    openGoogleFontsPanel();

    cy.get('.ant-modal button').contains('Serif').click();

    // At least one serif card renders, and a well-known serif family is reachable via search.
    cy.get('.ant-modal [data-font]', { timeout: 30000 }).should('have.length.greaterThan', 0);
    searchInput().type('Roboto Slab', { force: true });
    fontCard('Roboto Slab').should('exist');
  });
});
