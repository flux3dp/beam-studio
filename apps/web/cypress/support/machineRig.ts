// Shared helpers for the READ-ONLY machine specs (Tier B, local rig only).
//
// These specs exercise operations that query a real machine on the bench WITHOUT
// committing a laser job: connection, Machine Info, the idle Dashboard/Monitor and
// camera preview. They never upload+run F-code, never fire the laser, never move the
// gantry for a job. They self-skip on GitHub CI and when no rig machine name is provided.
//
// Machine display names are ENV-DRIVEN so any operator can point the rig at their own
// bench without editing specs:
//   CYPRESS_machineName="beamo (Adam)"   # beam-series / CO2 (bed camera)
//   CYPRESS_adorName="Ador (Cruz)"        # Ador (bed camera + module info)
//   CYPRESS_beamo2Name="beamo II (...)"   # beamo II / newer beam-series (bed camera)
// A machine whose env var is unset is simply skipped — set only the ones on your bench.

export const isRunningAtGithub = (): boolean => Cypress.env('envType') === 'github';

export interface RigTarget {
  /** Cypress env key that holds the machine's display name. */
  key: string;
  /** Human label used in test titles. */
  label: string;
}

/**
 * Camera-equipped machine slots the rig may expose, in priority order. All support
 * camera preview and the idle File dashboard. (Promark is intentionally absent — it has
 * no bed camera and no File dashboard, so its read-only surface differs and is covered
 * separately if ever needed.)
 */
export const RIG_TARGETS: readonly RigTarget[] = [
  { key: 'machineName', label: 'Beam Series' },
  { key: 'adorName', label: 'Ador' },
  { key: 'beamo2Name', label: 'beamo II' },
] as const;

export interface ConnectedTarget extends RigTarget {
  name: string;
}

/** The subset of RIG_TARGETS whose display name is actually provided via env. */
export const connectedTargets = (): ConnectedTarget[] =>
  RIG_TARGETS.map((t) => ({ ...t, name: Cypress.env(t.key) as string | undefined })).filter((t): t is ConnectedTarget =>
    Boolean(t.name),
  );

/**
 * Guard for a read-only machine describe block. Returns true (and registers a single
 * placeholder `it` that logs why) when the suite must be skipped — on GitHub, or when
 * no rig machine name is configured. Usage:
 *
 *   if (skipUnlessRig(connectedTargets())) return;
 */
export const skipUnlessRig = (targets: ConnectedTarget[]): boolean => {
  if (isRunningAtGithub()) {
    it('skips on github (needs a machine on the bench)', () => {
      cy.log('skip: read-only machine specs require a local rig + machine');
    });

    return true;
  }

  if (targets.length === 0) {
    it('skips: no rig machine configured', () => {
      cy.log(
        'skip: set at least one of CYPRESS_machineName / CYPRESS_adorName / CYPRESS_beamo2Name to a connected machine name',
      );
    });

    return true;
  }

  return false;
};

/**
 * Land in the editor pointed at the right FLUXGhost.
 *
 * When CYPRESS_ghostPort is supplied (the local-rig runner auto-detects the flux_api port
 * bundled with the compiled Beam Studio app), target the LOCAL FLUXGhost at 127.0.0.1:<port>.
 * Otherwise fall back to the office rig at backendIP:8000. Host/port are written in
 * onBeforeLoad so they survive the editor landing.
 */
export const landEditorWiredToGhost = (): void => {
  const ghostPort = Cypress.env('ghostPort');
  const host = ghostPort ? '127.0.0.1' : Cypress.env('backendIP');

  cy.landingEditor({
    onBeforeLoad(win) {
      win.localStorage.setItem('host', host);

      if (ghostPort) {
        win.localStorage.setItem('port', String(ghostPort));
      }
    },
  });
};

/** Land in the editor wired to the right FLUXGhost, then connect to the machine. */
export const enterEditorAndConnect = (machineName: string): void => {
  landEditorWiredToGhost();
  cy.connectMachine(machineName);
};
