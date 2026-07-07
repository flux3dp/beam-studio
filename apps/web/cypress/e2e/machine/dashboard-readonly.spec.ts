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

      it('opens the Monitor in idle mode showing status + read-only tabs, no job started', () => {
        cy.getMenuItem(['Machines', name], 'Dashboard').click();

        // Monitor is a DraggableModal titled `${device.name} - ${statusText}` and is the only
        // modal with a tab strip — gate on the tabs so the "Connecting <name>…" progress modal
        // (same .ant-modal-content selector, also contains the name) can never satisfy this.
        cy.get('.ant-modal-content:has(.ant-tabs)', { timeout: 20000 }).as('monitor');
        cy.get('@monitor').should('contain', name);

        // Idle machine → File mode: the File tab is the read-only surface. The Task tab only
        // appears once a job image exists (i.e. after sending work) — asserting it is ABSENT
        // guards that we stayed read-only. The Camera tab is nulled for North-America locales
        // (Monitor.tsx localeHelper.isNorthAmerica gate), so it is asserted conditionally.
        cy.get('@monitor').within(() => {
          cy.get('.ant-tabs-tab').contains('File').should('exist');
          cy.get('.ant-tabs-tab').contains('Task').should('not.exist');
        });
        cy.window().then((win) => {
          // Mirror locale-helper.ts detectNorthAmerica exactly: a US/CA region in any browser
          // locale AND a UTC-4..UTC-10 timezone offset.
          const locales = win.navigator.languages || [win.navigator.language];
          const hasNaRegion = Array.from(locales).some((locale) => /-(US|CA)\b/i.test(locale));
          const tzOffset = new Date().getTimezoneOffset();
          const isNorthAmerica = hasNaRegion && tzOffset <= 600 && tzOffset >= 240;

          if (isNorthAmerica) {
            cy.log('Camera tab assertion skipped: North-America locale hides it (patent gate)');
          } else {
            cy.get('@monitor').within(() => {
              cy.get('.ant-tabs-tab').contains('Camera').should('exist');
            });
          }
        });

        // Close the dashboard (footer is null; use the modal close button).
        cy.get('.ant-modal-close').click();
        cy.get('.ant-modal-content').should('not.exist');
      });
    });
  });
});
