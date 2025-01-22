import communicator from '@app/implementations/communicator';

const initBackendEvents = (): void => {
  communicator.on('BACKEND_UP', (_: any, status: { alive: boolean; logfile: any; port: number }) => {
    window.FLUX.ghostPort = status.port;
    window.FLUX.logfile = status.logfile;
    window.FLUX.backendAlive = status.alive;
    console.log(`Backend start at ${status.port}`);
  });

  communicator.on('BACKEND_DOWN', () => {
    window.FLUX.backendAlive = false;
  });

  communicator.on(
    'NOTIFY_BACKEND_STATUS',
    (_: any, status: { backend: { alive: boolean; logfile: any; port: number } }) => {
      console.log(status);
      window.FLUX.ghostPort = status.backend.port;
      window.FLUX.logfile = status.backend.logfile;
      window.FLUX.backendAlive = status.backend.alive;

      if (status.backend.alive) {
        console.log(`Backend ready at ${status.backend.port}`);
      } else {
        console.log('Backend Down');
      }
    },
  );

  communicator.send('CHECK_BACKEND_STATUS');
  communicator.send('NOTIFY_LANGUAGE');
};

export default initBackendEvents;
