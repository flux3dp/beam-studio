// Release-test coverage:
//   - 從桌面匯入 beam 檔功能正常 (拖曳直接將場景檔案匯入)
//       -> "imports a .beam scene via drag-drop" below.
//   - Open recent Project 功能正常 (檔案>最近使用)
//       -> Electron-only. See the note on the skipped test at the bottom of this file.
//
// Why the "Open Recent" case is not automated in the web suite:
//   The recent-files feature is desktop-only in every surface it touches, so it cannot be
//   registered nor displayed in the web build that this Cypress suite runs against:
//     1. The "File > Open Recent" (最近使用) native menu lives in Electron
//        (apps/app/src/node/menu/fileMenu.ts). The web build has no such menu, and the web
//        recentMenuUpdater (apps/web/src/implementations/recentMenuUpdater.ts) is a no-op stub.
//     2. The Welcome/home-page "Recent Files" tab is gated behind `!isWeb()`
//        (packages/core/src/web/app/pages/Welcome.tsx), so it is not rendered in web at all.
//     3. Even if the tab rendered, TabRecentFiles filters every entry through
//        `fileSystem.exists(filePath)` (TabRecentFiles.tsx), and the web fileSystem stub
//        (apps/web/src/implementations/fileSystem.ts) always returns false.
//     4. A web "Save"/"Save As" downloads the file via the browser and its writeFileDialog
//        returns null (apps/web/src/implementations/dialog.ts), so updateRecentFiles() is
//        never invoked and localStorage['recent_files'] is never populated.
//   The full "Open Recent" flow is therefore exercised only on the desktop app, which has no
//   Cypress harness. It is left as a skipped, self-documenting placeholder here.

const layerListPrefix =
  '_-_-packages-core-src-web-app-components-beambox-RightPanel-LayerPanel-LayerList-module__';

describe('recent files', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('imports a .beam scene via drag-drop', () => {
    // cy.uploadFile drops the fixture onto the import <input> via a DataTransfer, which is the
    // exact code path a desktop drag-drop of a scene file onto the canvas uses.
    cy.uploadFile('laser.beam');

    // The scene restores its single laser layer (default title 預設圖層)...
    cy.get(`div[class*="${layerListPrefix}row"]`)
      .should('have.attr', 'data-layer', '預設圖層');

    // ...and its single rect element (500x500, fill #333333) as #svg_1 in #svgcontent.
    cy.get('#svgcontent #svg_1')
      .should('exist')
      .and('have.attr', 'width', '500')
      .and('have.attr', 'height', '500')
      .and('have.attr', 'fill', '#333333');
  });

  // Open recent Project (檔案 > 最近使用) — Electron-only, see the header note above.
  it.skip('opens a project from File > Open Recent (desktop-only)', () => {
    // No-op: the recent-files menu/tab does not exist in the web build and cannot be
    // populated without Electron. Covered by the desktop release checklist instead.
  });
});
