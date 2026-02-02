import { BackendEvents, MiscEvents } from '@core/app/constants/ipcEvents';
import communicator from '@core/implementations/communicator';

const initBackendEvents = (): void => {
  communicator.on(BackendEvents.BackendUp, (_: any, status: { alive: boolean; logFile: any; port: number }) => {
    window.FLUX.ghostPort = status.port;
    window.FLUX.logFile = status.logFile;
    window.FLUX.backendAlive = status.alive;
    console.log(`Backend start at ${status.port}`);
  });

  communicator.on(
    BackendEvents.NotifyBackendStatus,
    (_: any, status: { backend: { alive: boolean; logFile: any; port: number } }) => {
      console.log(status);
      window.FLUX.ghostPort = status.backend.port;
      window.FLUX.logFile = status.backend.logFile;
      window.FLUX.backendAlive = status.backend.alive;

      if (status.backend.alive) {
        console.log(`Backend ready at ${status.backend.port}`);
      } else {
        console.log('Backend Down');
      }
    },
  );

  communicator.send(BackendEvents.CheckBackendStatus);
  communicator.send(MiscEvents.NotifyLanguage);
};

export default initBackendEvents;
