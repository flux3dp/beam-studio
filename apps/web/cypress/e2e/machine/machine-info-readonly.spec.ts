// Read-only machine test — Machine Info dialog.
//
// Release-test sheet: 機器資訊 / connection sanity. Connects to a real machine and opens
// Machines > <machine> > Machine Info, which reads device detail over the wire
// (DeviceMaster.select + getDeviceDetailInfo) and renders Model Name / IP / Serial Number /
// Firmware Version / UUID. Pure READ — no job is uploaded or run.
//
// Local rig only; self-skips on GitHub and when no machine name env var is set.
import { connectedTargets, enterEditorAndConnect, skipUnlessRig } from '../../support/machineRig';

const targets = connectedTargets();

describe('machine info (read-only)', () => {
  if (skipUnlessRig(targets)) return;

  targets.forEach(({ label, name }) => {
    describe(`${label} — ${name}`, () => {
      beforeEach(() => {
        enterEditorAndConnect(name);
      });

      it('shows Model Name / IP / Serial / Firmware / UUID from the live machine', () => {
        cy.getMenuItem(['Machines', name], 'Machine Info').click();

        // The Alert.popUp (id="machine-info") renders every device-detail label.
        cy.get('.ant-modal-content', { timeout: 20000 }).as('info');
        cy.get('@info').should('contain', 'Model Name');
        cy.get('@info').should('contain', 'IP');
        cy.get('@info').should('contain', 'Serial Number');
        cy.get('@info').should('contain', 'Firmware Version');
        cy.get('@info').should('contain', 'UUID');

        // The values are read back from the machine — assert a real IPv4 came through
        // (proves the read round-tripped, not just static labels).
        cy.get('@info')
          .invoke('text')
          .should('match', /IP:\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

        // Close without triggering the Network Test action.
        cy.get('.ant-modal-footer .ant-btn').contains('OK').click();
        cy.get('.ant-modal-content').should('not.exist');
      });
    });
  });
});
