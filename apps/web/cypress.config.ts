import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

const preset = nxE2EPreset(__filename, {
  cypressDir: 'cypress/',
  webServerCommands: { default: 'nx run web:start' },
  webServerConfig: { timeout: 300000 }, // 5min
  ciWebServerCommand: 'nx run web:start',
});

export const envVariables = {
  cypressDownloadPath: './cypress/downloads/download.json',
  cypressDownloadBeamPath: './cypress/downloads/untitled.beam',
  cypressDownloadNewBeamPath: './cypress/downloads/untitled.beam',
  cypressDownloadBvgPath: './cypress/downloads/untitled.bvg',
  cypressDownloadSvgPath: './cypress/downloads/untitled.svg',
  cypressDownloadPngPath: './cypress/downloads/untitled.png',
  cypressDownloadJpegPath: './cypress/downloads/untitled.jpeg',
  cypressDownloadJpgPath: './cypress/downloads/untitled.jpg',
  username: 'beam-studio-web@flux3dp.com',
  password: 'Flux42642569',
  envType: 'local',
  backendIP: '192.168.1.114',
  // Machine display names (machineName / adorName / beamo2Name) are ENV-DRIVEN and
  // intentionally have NO defaults here: a slot without its CYPRESS_* name set is skipped by
  // the read-only rig specs, and the job-capable machine specs fail fast instead of silently
  // driving whichever LAN machine happens to match a baked-in name. Reference-bench names
  // (office rig): machineName "beamo (Adam)", adorName "Ador (Cruz)".
  // `beamSeriesName` (read by several older specs) is aliased to machineName at runtime in
  // setupNodeEvents — an explicit CYPRESS_beamSeriesName still wins.
};

export default defineConfig({
  projectId: 'fc84dg',
  env: envVariables,
  e2e: {
    async setupNodeEvents(on, config) {
      await preset.setupNodeEvents(on, config);
      require('./cypress/plugins/index.ts')(on, config);

      // `beamSeriesName` is a LIVE alias of `machineName` (older machine specs read the former):
      // overriding CYPRESS_machineName moves both, so one run can never split across two
      // physical machines. An explicit CYPRESS_beamSeriesName still wins.
      if (!config.env.beamSeriesName && config.env.machineName) {
        config.env.beamSeriesName = config.env.machineName;
      }

      return config;
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
  retries: {
    runMode: 3,
  },
  defaultCommandTimeout: 15000,
  pageLoadTimeout: 120000, // 2 minutes for slow initial page loads
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 30,
  viewportWidth: 1280,
  viewportHeight: 800,
});
