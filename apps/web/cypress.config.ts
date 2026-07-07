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
  // Machine display names for the local-rig specs. These are DEFAULTS for the reference
  // bench — override per operator with CYPRESS_machineName / CYPRESS_adorName /
  // CYPRESS_beamo2Name to point the rig at your own machines. `beamSeriesName` is an alias
  // of `machineName` kept because several existing specs read the name by that key.
  machineName: 'beamo (Adam)',
  beamSeriesName: 'beamo (Adam)',
  adorName: 'Ador (Cruz)',
  // beamo2Name has no default — the read-only rig specs skip it unless CYPRESS_beamo2Name is set.
};

export default defineConfig({
  projectId: 'fc84dg',
  env: envVariables,
  e2e: {
    async setupNodeEvents(on, config) {
      await preset.setupNodeEvents(on, config);

      return require('./cypress/plugins/index.ts')(on, config);
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
