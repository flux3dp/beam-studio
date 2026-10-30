import config, { envVariables } from './cypress.config';

export default {
  ...config,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/results/junit-[hash].xml',
    toConsole: true,
  },
  env: {
    ...envVariables,
    envType: 'github',
    connectMachineIP: undefined,
  },
  experimentalMemoryManagement: true,
  viewportWidth: 1280,
  viewportHeight: 800,
}
