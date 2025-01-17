import { defineConfig } from 'cypress'

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
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config)
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
  retries: {
    runMode: 3,
    openMode: 1,
  },
  defaultCommandTimeout: 15000,
  experimentalMemoryManagement: true,
})
