// Read-only machine test — Network Testing (檢測網路設定).
//
// Release-test sheet: 檢測網路設定. Exercises the menu-triggered Network Testing modal against a
// REAL machine IP discovered by FLUXGhost (never a hardcoded IP): read the discovered machine's
// IP from its Machine Info dialog, then open Machines > Test Network Settings, enter that IP, run
// the test, and assert it completes with a result. Pure READ — pings only, no job.
//
// The web networkTest is a browser-side XHR ping loop against http://<ip> for 30s, so it always
// finishes with a "Test Completed" alert (healthy quality when the host answers, or a #840
// cannot-connect message otherwise). A discovered machine's IP is the panel's recognised-device
// path, so a reachable machine yields the healthy result.
//
// Local rig only; self-skips on GitHub and when no machine name env var is set.
import { connectedTargets, landEditorWiredToGhost, skipUnlessRig } from '../../support/machineRig';

const IPV4 = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
// networkTest runs a fixed 30s ping loop; leave headroom for the result alert.
const TEST_RESULT_TIMEOUT = 45000;
const targets = connectedTargets();

describe('network testing (read-only)', () => {
  if (skipUnlessRig(targets)) return;

  targets.forEach(({ label, name }) => {
    describe(`${label} — ${name}`, () => {
      beforeEach(() => {
        // Discovery populates the Machines menu without connecting — no need to select the device.
        landEditorWiredToGhost();
      });

      it('tests the discovered machine IP via Machines > Network Testing', () => {
        // 1. Read the IP FLUXGhost discovered for this machine, from its Machine Info dialog.
        cy.getMenuItem(['Machines', name], 'Machine Info').click({ force: true });
        cy.get('.ant-modal-content', { timeout: 20000 }).should('contain', 'IP');
        cy.get('.ant-modal-content')
          .invoke('text')
          .then((text) => {
            const match = text.match(IPV4);

            expect(match, `a discovered IPv4 for ${name}`).to.not.eq(null);

            const ip = match![1];

            cy.log(`discovered IP for "${name}": ${ip}`);
            cy.get('.ant-modal-footer .ant-btn').contains('OK').click();
            cy.get('.ant-modal-content').should('not.exist');

            // 2. Open the Network Testing modal from the menu (not from Machine Info's button).
            cy.getMenuItem(['Machines'], 'Test Network Settings').click({ force: true });
            cy.contains('.ant-modal', 'Network Testing').should('be.visible');

            // 3. Enter the discovered IP and start the test.
            cy.get('.ant-modal .ant-input').clear().type(ip);
            cy.get('.ant-modal-footer .ant-btn-primary').contains('Start').click();

            // 4. The test runs (progress) then pops a "Test Completed" result. Assert it landed and
            //    reports either a connection quality (reachable) or the #840 cannot-connect message.
            cy.contains('.ant-modal-content', 'Test Completed', { timeout: TEST_RESULT_TIMEOUT }).should('be.visible');
            cy.get('.ant-modal-content')
              .invoke('text')
              .should('match', /Connection Quality|Fail to connect/);
          });
      });
    });
  });
});
