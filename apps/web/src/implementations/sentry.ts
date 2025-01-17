import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';

const initSentry = (): void => {
  Sentry.init({
    dsn: 'https://bbd96134db9147658677dcf024ae5a83@o28957.ingest.sentry.io/5617300',
    release: 'Beam-Studio-Web@1.0.0',
    integrations: [new Integrations.BrowserTracing()],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
  Sentry.setTag('web', true);
};

export default {
  Sentry,
  initSentry,
};
