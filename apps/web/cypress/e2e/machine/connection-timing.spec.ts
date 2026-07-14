// Read-only machine test — connection completes within budget.
//
// Release-test sheet row 305 (part): 連線是否在 20 秒內完成. Selects a real machine and measures
// wall-clock across the FULL connection window: the timer starts immediately before the device
// row is clicked (which is what triggers DeviceMaster.select + getReport — the workarea confirm
// only renders AFTER select() has already succeeded, so starting any later would exclude the
// connect phase), and stops when the top-bar button shows the machine name. Pure READ — no job.
//
// connectMachine owns the wait (clicking the conditional workarea confirm when present), so an
// over-budget connection still completes and fails the assertion with a clear elapsed time.
//
// Local rig only; self-skips on GitHub and when no machine name env var is set.
import { connectedTargets, landEditorWiredToGhost, skipUnlessRig } from '../../support/machineRig';

const CONNECT_BUDGET_MS = 20000;
const targets = connectedTargets();

describe('machine connection timing (read-only)', () => {
  if (skipUnlessRig(targets)) return;

  targets.forEach(({ label, name }) => {
    it(`${label} — ${name}: connects within ${CONNECT_BUDGET_MS / 1000}s`, () => {
      landEditorWiredToGhost();

      let startedAt = 0;

      cy.connectMachine(name, {
        onSelect: () => {
          startedAt = performance.now();
        },
      });

      cy.then(() => {
        const elapsed = performance.now() - startedAt;

        cy.log(`connected in ${Math.round(elapsed)}ms`);
        expect(elapsed, 'connection time').to.be.lessThan(CONNECT_BUDGET_MS);
      });
    });
  });
});
