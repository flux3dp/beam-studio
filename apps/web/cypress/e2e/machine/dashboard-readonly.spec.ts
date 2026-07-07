// Read-only machine test — idle Dashboard (Monitor) opens without starting a job.
//
// Release-test sheet row 305 (part): Dashboard. When the machine is idle (st_id <= 0) and
// not a Promark, Machines > <machine> > Dashboard opens the Monitor in Mode.FILE — the
// file browser + live status read from getReport. This asserts the dashboard is reachable
// and shows the machine's name + status, WITHOUT uploading or running a task.
//
// It deliberately does NOT touch Start/Go, and never enters Mode.WORKING. Pure READ.
// Local rig only; self-skips on GitHub and when no machine name env var is set.
import { connectedTargets, enterEditorAndConnect, skipUnlessRig } from '../../support/machineRig';

const targets = connectedTargets();

describe('idle dashboard (read-only)', () => {
  if (skipUnlessRig(targets)) return;

  targets.forEach(({ label, name }) => {
    describe(`${label} — ${name}`, () => {
      beforeEach(() => {
        enterEditorAndConnect(name);
      });

      it('opens the Monitor in idle mode showing status + File/Camera tabs, no job started', () => {
        cy.getMenuItem(['Machines', name], 'Dashboard').click();

        // Monitor is a DraggableModal titled `${device.name} - ${statusText}`.
        cy.get('.ant-modal-content', { timeout: 20000 }).as('monitor');
        cy.get('@monitor').should('contain', name);

        // Idle machine → File mode: the File and Camera tabs are the read-only surface.
        // (Task tab only appears once a job image exists, i.e. after sending work — it
        // must NOT be present here, which guards that we stayed read-only.)
        cy.get('@monitor').within(() => {
          cy.get('.ant-tabs-tab').contains('File').should('exist');
          cy.get('.ant-tabs-tab').contains('Camera').should('exist');
          cy.get('.ant-tabs-tab').contains('Task').should('not.exist');
        });

        // Close the dashboard (footer is null; use the modal close button).
        cy.get('.ant-modal-close').click();
        cy.get('.ant-modal-content').should('not.exist');
      });
    });
  });
});
