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
  machineName: 'beamo (Adam)',
  adorName: 'Ador (Cruz)',
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
});
