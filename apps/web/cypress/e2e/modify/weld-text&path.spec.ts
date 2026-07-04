// Release-test case: 合併文字功能是否正常
// Weld several text characters into a single welded path ("把數個文字當成一字元"),
// then decompose the welded path (解散非連續路徑) to split it back into multiple sub-paths.
//
// PLATFORM-SAFETY: no md5/path-d checksums (path `d` differs per OS/font rasterizer).
// Assertions are structural: element counts, tag names, non-empty `d`, layer/title text,
// and float-tolerant bounding-box dimensions via cy.inputValueCloseTo.

describe('weld text & decompose path', () => {
  const drawText = () => {
    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 100 });
    // Wait for the text element to be created.
    cy.get('#svg_1').should('exist');
    // Overlapping / adjacent characters so weld merges them into one connected outline.
    cy.inputText('123');
    cy.getElementTitle().should('have.text', 'Layer 1 > Text');

    cy.showPanel('objects');
    cy.get('div#object-panel').should('exist');

    // Set an always-bundled font explicitly for determinism across platforms.
    cy.get('.ant-select-selection-item[title="Font"]').click();
    cy.get('.ant-select-item-option-content img[alt="Mr Bedfort"]').click();
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').should('exist');
    cy.get('#svg_1').should('have.attr', 'font-family').and('eq', "'Mr Bedfort'");
    cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').should('not.exist');

    // Negative letter spacing pulls glyphs together so they overlap and weld as one unit.
    cy.get('#letter_spacing').clear().type('1.5{enter}');
    cy.get('#svg_1').should('have.attr', 'letter-spacing').and('eq', '1.5em');
  };

  beforeEach(() => {
    cy.landingEditor();
    drawText();
  });

  it('welds text characters into a single path', () => {
    cy.get('#weld').click();

    // Text (#svg_1) is replaced by a single welded path (#svg_2).
    cy.get('#svg_2', { timeout: 15000 }).should('exist');
    cy.get('#svg_1').should('not.exist');
    cy.get('#svg_2').should(($el) => {
      expect($el[0].tagName.toLowerCase()).to.equal('path');
    });
    cy.get('#svg_2').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');

    // The welded path has a non-empty `d`.
    cy.get('#svg_2').should(($el) => {
      const d = $el.attr('d');

      expect(d, 'welded path d').to.exist;
      expect((d || '').length, 'welded path d length').to.be.greaterThan(0);
    });

    // Exactly one element under svgcontent (the welded path) besides selection helpers.
    cy.get('#svgcontent > g.layer > path').should('have.length', 1);

    // Welded result keeps a sensible bounding box (float-tolerant).
    cy.showPanel('objects');
    cy.get('#w_size').invoke('val').then((w) => expect(Number(w)).to.be.greaterThan(0));
    cy.get('#h_size').invoke('val').then((h) => expect(Number(h)).to.be.greaterThan(0));
  });

  it('decomposes the welded path into multiple sub-paths', () => {
    cy.get('#weld').click();

    cy.get('#svg_2', { timeout: 15000 }).should('exist');
    cy.get('#svg_2').click({ force: true });
    cy.getElementTitle().should('have.text', 'Layer 1 > Path');

    // Record the welded path's bounding box before decompose to compare afterwards.
    cy.showPanel('objects');

    let weldedW = 0;
    let weldedH = 0;

    cy.get('#w_size').invoke('val').then((w) => {
      weldedW = Number(w);
    });
    cy.get('#h_size').invoke('val').then((h) => {
      weldedH = Number(h);
    });

    // Decompose (解散非連續路徑) splits the single welded path into its sub-paths.
    // The new paths are auto-selected, so they live inside a temp-group wrapper.
    cy.get('#decompose_path').click();

    // Original welded path is removed; multiple new path elements are created.
    cy.get('#svg_2').should('not.exist');
    cy.get('#svgcontent g[data-tempgroup="true"] path').should('have.length.greaterThan', 1);

    // Every decomposed element is a <path> with a non-empty `d`.
    cy.get('#svgcontent g[data-tempgroup="true"] path').each(($p) => {
      expect($p[0].tagName.toLowerCase()).to.equal('path');

      const d = $p.attr('d');

      expect(d, 'sub-path d').to.exist;
      expect((d || '').length, 'sub-path d length').to.be.greaterThan(0);
    });

    // Decomposed selection covers roughly the same bounding box as the welded path.
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get('#w_size').invoke('val').then((w) => {
      expect(Number(w)).to.be.closeTo(weldedW, 1);
    });
    cy.get('#h_size').invoke('val').then((h) => {
      expect(Number(h)).to.be.closeTo(weldedH, 1);
    });
  });
});
