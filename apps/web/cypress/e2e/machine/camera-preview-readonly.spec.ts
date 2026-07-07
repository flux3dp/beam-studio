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
//     shot on every model tested (Ador + BB2). The wide-angle full-area button is a fallback taken
//     only when the region camera never ENABLES within the settle window (wide-angle needs fisheye
//     calibration params and returns no frame without them).
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

        // The floating-bar camera buttons are <div>s: their disabled state is a CSS-module
        // class (styles.disabled) plus an onClick guard — never a `disabled` attribute — so
        // enablement must be checked via the class list.
        const isEnabled = ($el: JQuery): boolean => $el.length > 0 && !/disabled/i.test($el.attr('class') || '');
        const dragRegionCapture = (): void => {
          cy.get('svg#svgcontent')
            .trigger('mousedown', 150, 150, { force: true })
            .trigger('mousemove', 350, 350, { force: true })
            .trigger('mouseup', { force: true });
        };

        // Settle-poll instead of fixed sleeps: camera setup resolves into one of —
        //  (a) Ador's Auto Focus dialog → take the manual height-0 path (Enter Manually sets
        //      the value to 0 internally per PreviewHeight.tsx, Apply commits it), then keep
        //      polling until the region camera enables;
        //  (b) the region camera (#laser-head-camera) enables → arm it and drag a box;
        //  (c) region never enables within the window → fall back to the wide-angle full-area
        //      button if that one is enabled (needs fisheye calibration to return a frame).
        let afHandled = false;
        const SETTLE_BUDGET_MS = 20000;
        const settleStart = { at: 0 };
        const settleAndCapture = (): void => {
          cy.get('body').then(($body) => {
            if (!afHandled && /enter manually/i.test($body.text())) {
              afHandled = true;
              cy.contains('.ant-modal-content .ant-btn', 'Enter Manually').click();
              cy.get('.ant-modal-content .ant-btn-primary', { timeout: 10000 }).contains('Apply').click();
              cy.get('.ant-modal-content').should('not.exist');
              cy.then(settleAndCapture);

              return;
            }

            if (isEnabled($body.find('#laser-head-camera'))) {
              cy.get('#laser-head-camera').click({ force: true });
              dragRegionCapture();

              return;
            }

            if (performance.now() - settleStart.at > SETTLE_BUDGET_MS) {
              if (isEnabled($body.find('#wide-angle-camera'))) {
                cy.get('#wide-angle-camera').click({ force: true });

                return;
              }

              throw new Error('camera preview never became ready: no enabled capture control within budget');
            }

            cy.wait(500).then(settleAndCapture);
          });
        };

        cy.then(() => {
          settleStart.at = performance.now();
        }).then(settleAndCapture);

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
