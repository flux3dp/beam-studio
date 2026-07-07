// Read-only machine test — camera preview renders a bed-camera frame.
//
// Release-test sheet rows 200–201: 相機預覽功能是否可用 / 相機連線. Connects to a real machine,
// enters camera-preview mode (left-panel Preview button), and captures a real bed-camera frame,
// asserting the image lands in #previewSvg #backgroundImage as a blob: URL.
//
// READ-only in the job sense: the bed camera is read and the head moves to frame the shot, but
// NO F-code is uploaded and the laser never fires. It never sends a job.
//
// Capture mechanics differ by model; this drives whichever the machine offers:
//   - Ador gates capture behind an Auto Focus dialog. We only need to prove a frame renders (not
//     focus accurately), so we take the manual path with height 0: "Enter Manually" sets the
//     value to 0 internally (PreviewHeight.tsx) → the next step's "Apply" commits it.
//   - Capture is triggered with the laser-head REGION camera (a canvas drag), which returns a bed
//     shot on every model tested (Ador + BB2). The wide-angle full-area button is only a fallback
//     for machines that don't offer the region camera (wide-angle needs fisheye calibration params
//     and returns no frame without them).
//
// One test per machine (single connect — avoids reconnect flakiness on shared bench machines).
// Local rig only; self-skips on GitHub and when no machine name env var is set.
import { connectedTargets, enterEditorAndConnect, skipUnlessRig } from '../../support/machineRig';

// Camera warmup + region capture can take a while on real hardware.
const CAPTURE_BUDGET_MS = 40000;
const targets = connectedTargets();

describe('camera preview (read-only)', () => {
  if (skipUnlessRig(targets)) return;

  targets.forEach(({ label, name }) => {
    describe(`${label} — ${name}`, () => {
      beforeEach(() => {
        enterEditorAndConnect(name);
      });

      it('engages preview mode and renders a bed-camera frame', () => {
        cy.clickToolBtn('Preview', false);

        // Preview engaged when the floating bar renders OR camera setup surfaces a dialog.
        cy.get('#end-preview-mode, .ant-modal-content', { timeout: 20000 }).should('exist');

        // Ador Auto Focus dialog: take the manual height-0 path (Enter Manually → Apply).
        cy.wait(2500);
        cy.get('body').then(($body) => {
          if (/enter manually/i.test($body.text())) {
            cy.contains('.ant-modal-content .ant-btn', 'Enter Manually').click();
            cy.get('.ant-modal-content .ant-btn-primary', { timeout: 10000 }).contains('Apply').click();
            cy.wait(1500);
          }
        });

        // Trigger the capture with the region camera (drag), falling back to wide-angle.
        cy.get('body').then(($body) => {
          if ($body.find('#laser-head-camera:not([disabled])').length) {
            cy.get('#laser-head-camera').click({ force: true });
            cy.get('svg#svgcontent')
              .trigger('mousedown', 150, 150, { force: true })
              .trigger('mousemove', 350, 350, { force: true })
              .trigger('mouseup', { force: true });
          } else if ($body.find('#wide-angle-camera:not([disabled])').length) {
            cy.get('#wide-angle-camera').click({ force: true });
          } else {
            cy.get('svg#svgcontent')
              .trigger('mousedown', 150, 150, { force: true })
              .trigger('mousemove', 350, 350, { force: true })
              .trigger('mouseup', { force: true });
          }
        });

        // HARD: a real camera frame lands in the preview overlay as a blob: image.
        cy.get('#previewSvg #backgroundImage', { timeout: CAPTURE_BUDGET_MS })
          .should('exist')
          .and('have.attr', 'xlink:href')
          .and('match', /^blob:/);

        // Exit preview cleanly.
        cy.get('#end-preview-mode').should('be.visible').click();
        cy.get('#svgcontent', { timeout: 15000 }).should('exist');
      });
    });
  });
});
