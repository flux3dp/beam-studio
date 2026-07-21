/**
 * Covers the release-test row 圖像編輯「確認圖像編輯的功能是否可正常使用」 — the standalone
 * "Edit Image" (Bitmap Image Editing) full-window panel opened from the object panel's
 * `#imageEditPanel` button (dialog-caller `showImageEditPanel`, component
 * packages/core/src/web/app/components/ImageEditPanel).
 *
 * This window is DISTINCT from the individual object-panel operations exercised in
 * left-panel/image.spec.ts (gradient toggle, replace, grading, crop, invert). The window
 * hosts three tools — Eraser, Magic Wand, Rounded Corner — plus zoom/undo/redo, and on OK
 * rewrites the canvas image's `xlink:href` / `origImage` via handle-finish. All processing is
 * client-side (Konva canvas), so the spec runs everywhere including CI (no FLUXGhost needed).
 */

const TAB = { cornerRadius: 2, eraser: 0, magicWand: 1 } as const;

/** Input scoped to the currently visible tab — Ant keeps inactive panels mounted but hidden. */
const activeInput = () => cy.get('.ant-tabs-tabpane-active .ant-input-number-input');

const uploadAndSelect = () => {
  cy.disableImageDownSampling();
  cy.uploadFile('flux.png', 'image/png');
  cy.waitForImageProcessing();
  cy.get('#svg_1').click({ force: true });
  cy.showPanel('objects');
};

const openImageEditPanel = () => {
  cy.get('#imageEditPanel').click();
  // FullWindowPanel header mounts immediately; the Konva stage <canvas> appears after the
  // 1s init timeout + init progress clears.
  cy.contains('Edit Image', { timeout: 30000 }).should('exist');
  cy.waitForProgress(30000);
  cy.get('.konvajs-content canvas', { timeout: 30000 }).should('exist');
};

/** Switch to one of the three tool tabs by its index and confirm it is active. */
const selectTab = (tab: keyof typeof TAB) => {
  cy.get('.ant-tabs-tab').eq(TAB[tab]).click();
  cy.get('.ant-tabs-tab').eq(TAB[tab]).should('have.class', 'ant-tabs-tab-active');
};

/**
 * Draw across the Konva stage canvas: mousedown -> mousemove -> mouseup records one op.
 *
 * Each event is issued as its OWN Cypress command (not a chained `.trigger().trigger()`), so
 * the event loop turns and React flushes state between them. The eraser's mouseup handler only
 * commits the stroke to history when the `operation` state set on mousedown has been applied —
 * chaining the triggers back-to-back fires mouseup before that flush and drops the stroke.
 */
const stage = () => cy.get('.konvajs-content').first();

/** Yield to a real animation frame so pending React state (e.g. the eraser's `operation`) flushes. */
const flushFrame = () =>
  cy.window().then((win) => new Cypress.Promise<void>((resolve) => win.requestAnimationFrame(() => resolve())));

const strokeStage = (from: [number, number], to: [number, number]) => {
  const mid: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];

  // Konva binds its native pointer listeners to the `.konvajs-content` div (the canvas child
  // is just the render surface). Fire on the div so the events reach Konva's dispatcher.
  //
  // The eraser commits its stroke on mouseup only when the `operation` state that mousedown
  // set has flushed and re-bound the Stage's handlers. `flushFrame` forces that flush between
  // mousedown and mouseup; without it, mouseup runs against a stale closure and drops the stroke.
  stage().trigger('mousedown', { button: 0, buttons: 1, clientX: from[0], clientY: from[1], force: true });
  flushFrame();
  stage().trigger('mousemove', { button: 0, buttons: 1, clientX: mid[0], clientY: mid[1], force: true });
  stage().trigger('mousemove', { button: 0, buttons: 1, clientX: to[0], clientY: to[1], force: true });
  flushFrame();
  stage().trigger('mouseup', { button: 0, buttons: 0, clientX: to[0], clientY: to[1], force: true });
};

const undoBtn = () => cy.get('button[title="Undo"]').first();
const redoBtn = () => cy.get('button[title="Redo"]').first();
const okBtn = () => cy.contains('button.ant-btn', 'OK');
const backBtn = () => cy.contains('button', 'Back to Beam Studio');

// The panel is closed once its Konva stage is gone. (Do NOT assert on the text "Edit Image":
// the object panel's own `#imageEditPanel` button carries that same label and reappears after
// the window closes.)
const assertPanelClosed = () => cy.get('.konvajs-content', { timeout: 30000 }).should('not.exist');

const getHref = () => cy.get('#svg_1').invoke('attr', 'xlink:href');

describe('Edit Image panel (bitmap image editing window)', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('opens the window with the three tools and zoom/undo controls', () => {
    uploadAndSelect();
    openImageEditPanel();

    // Three tool tabs: Eraser, Magic Wand, Rounded Corner.
    cy.get('.ant-tabs-tab').should('have.length', 3);
    // Eraser is the default active tool.
    cy.get('.ant-tabs-tab').eq(TAB.eraser).should('have.class', 'ant-tabs-tab-active');
    cy.contains('Eraser').should('exist');
    cy.contains('Brush Size').should('exist');

    // Undo/redo start disabled; OK footer button present.
    undoBtn().should('be.disabled');
    redoBtn().should('be.disabled');
    okBtn().should('exist');

    // Each tool tab reveals its own control.
    selectTab('magicWand');
    cy.contains('Tolerance').should('exist');
    selectTab('cornerRadius');
    cy.contains('Radius').should('exist');
  });

  it('Eraser: drawing a stroke records history (undo/redo become enabled)', () => {
    uploadAndSelect();
    openImageEditPanel();
    selectTab('eraser');

    // Adjust brush size via the input number and assert the value changed.
    activeInput().clear().type('60').blur();
    activeInput().should('have.value', '60');

    // Draw an eraser stroke over the image; this pushes an eraser op to history.
    undoBtn().should('be.disabled');
    strokeStage([850, 350], [950, 420]);
    undoBtn().should('not.be.disabled');

    // Undo removes the stroke and enables redo; redo restores it.
    undoBtn().click();
    undoBtn().should('be.disabled');
    redoBtn().should('not.be.disabled');
    redoBtn().click();
    redoBtn().should('be.disabled');
    undoBtn().should('not.be.disabled');
  });

  it('Magic Wand: adjusting tolerance and clicking selects a region (history recorded)', () => {
    uploadAndSelect();
    openImageEditPanel();
    selectTab('magicWand');

    // Adjust tolerance.
    activeInput().clear().type('80').blur();
    activeInput().should('have.value', '80');

    // Click on the image to select adjacent colors; a magicWand op is pushed to history.
    undoBtn().should('be.disabled');
    strokeStage([880, 380], [880, 380]);
    cy.waitForProgress(15000);
    undoBtn().should('not.be.disabled');
  });

  it('Rounded Corner: changing radius records history and can be undone', () => {
    uploadAndSelect();
    openImageEditPanel();
    selectTab('cornerRadius');

    // Set a rounded-corner radius; onBlur commits it to history.
    undoBtn().should('be.disabled');
    activeInput().clear().type('40').blur();
    activeInput().should('have.value', '40');
    undoBtn().should('not.be.disabled');

    // Undo restores radius 0.
    undoBtn().click();
    activeInput().should('have.value', '0');
    undoBtn().should('be.disabled');
  });

  it('applying (OK) rewrites the canvas image href', () => {
    uploadAndSelect();

    getHref().then((before) => {
      openImageEditPanel();
      selectTab('cornerRadius');

      // Make a meaningful edit.
      activeInput().clear().type('50').blur();
      undoBtn().should('not.be.disabled');

      // Apply.
      okBtn().click();
      cy.waitForProgress(30000);
      assertPanelClosed();
      cy.waitForImageProcessing();

      // The image element still exists and its href payload changed.
      cy.get('#svg_1').should('exist');
      getHref().should((after) => {
        expect(after).to.be.a('string');
        expect(after).not.to.equal(before);
      });
    });
  });

  it('cancelling (Back) leaves the canvas image unchanged', () => {
    uploadAndSelect();

    getHref().then((before) => {
      openImageEditPanel();
      selectTab('cornerRadius');

      // Make an edit but do NOT apply.
      activeInput().clear().type('50').blur();
      undoBtn().should('not.be.disabled');

      // Leave via the back button (cancel path).
      backBtn().click();
      assertPanelClosed();

      // Href is untouched.
      getHref().should('equal', before);
    });
  });
});
