import * as Sentry from '@sentry/electron';

const initSentry = (): void => {
  Sentry.init({ dsn: 'https://bbd96134db9147658677dcf024ae5a83@o28957.ingest.sentry.io/5617300' });
};

export default {
  Sentry,
  initSentry,
};
