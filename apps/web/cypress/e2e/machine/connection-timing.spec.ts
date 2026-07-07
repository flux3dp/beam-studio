// Read-only machine test — connection completes within budget.
//
// Release-test sheet row 305 (part): 連線是否在 20 秒內完成. Selects a real machine and
// measures wall-clock from confirming the selection (which triggers DeviceMaster.select +
// getReport) until the top-bar button reflects the connected machine. Pure READ — no job.
//
// Local rig only; self-skips on GitHub and when no machine name env var is set.
import { connectedTargets, isRunningAtGithub, landEditorWiredToGhost } from '../../support/machineRig';

const CONNECT_BUDGET_MS = 20000;
const targets = connectedTargets();

describe('machine connection timing (read-only)', () => {
  if (isRunningAtGithub()) {
    it('skips on github', () => {
      cy.log('skip: connection timing needs a local rig + machine');
    });

    return;
  }

  if (targets.length === 0) {
    it('skips: no rig machine configured', () => {
      cy.log('skip: set CYPRESS_machineName / CYPRESS_adorName / CYPRESS_beamo2Name');
    });

    return;
  }

  targets.forEach(({ label, name }) => {
    it(`${label} — ${name}: connects within ${CONNECT_BUDGET_MS / 1000}s`, () => {
      landEditorWiredToGhost();

      // Drive the selection inline so we can time the connect phase precisely.
      cy.findByTestId('select-machine').should('exist').click();
      cy.findByText(name).should('exist').click();

      // Timer starts when we confirm — this is when select()/getReport() run.
      const started: { at: number } = { at: 0 };

      cy.get('.ant-modal-footer .ant-btn-primary', { timeout: 30000 })
        .contains('Yes')
        .then(($btn) => {
          started.at = performance.now();
          $btn.trigger('click');
        });

      // Connected signal: the top-bar button now shows the machine name.
      // Generous wait so an over-budget connection still resolves and fails the
      // assertion with a clear elapsed time (rather than an ambiguous timeout).
      cy.findByTestId('select-machine', { timeout: 30000 }).contains(name).should('exist');

      cy.then(() => {
        const elapsed = performance.now() - started.at;

        cy.log(`connected in ${Math.round(elapsed)}ms`);
        expect(elapsed, 'connection time').to.be.lessThan(CONNECT_BUDGET_MS);
      });
    });
  });
});
