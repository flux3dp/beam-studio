import config, { envVariables } from './cypress.config';

export default {
  ...config,
  env: {
    ...envVariables,
    envType: 'github',
    connectMachineIP: undefined,
  },
  experimentalMemoryManagement: true,
  viewportWidth: 1280,
  viewportHeight: 800,
}
