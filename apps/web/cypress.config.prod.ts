import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'fc84dg',
  env: {
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
    envType: 'github',
  },
  e2e: {
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config)
    },
    baseUrl: 'http://studio.flux3dp.com',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
