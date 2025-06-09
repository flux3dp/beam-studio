import * as Sentry from '@sentry/electron/renderer';

const initSentry = (): void => {
  Sentry.init({ sendDefaultPii: true });
};

export default {
  initSentry,
  Sentry,
};
