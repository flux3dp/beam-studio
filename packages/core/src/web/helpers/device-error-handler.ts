import i18n from '@core/helpers/i18n';

export default {
  translate: (error: Record<string, unknown> | string | string[]): string => {
    const { lang } = i18n;

    // When error is object but not array
    if (typeof error === 'object' && !Array.isArray(error)) {
      return JSON.stringify(error);
    }

    let errorOutput = '';

    // always process error as array, hard fix for the backend

    error = Array.isArray(error) ? error : [error];

    if (error.length) {
      if (lang.generic_error[error[0] as keyof typeof lang.generic_error]) {
        return lang.generic_error[error[0] as keyof typeof lang.generic_error];
      }

      for (let i = error.length; i >= 1; i -= 1) {
        errorOutput = lang.monitor[error.slice(0, i).join('_') as keyof typeof lang.monitor] as string;

        if (errorOutput) {
          break;
        }
      }

      if (errorOutput === '' || typeof errorOutput === 'undefined') {
        errorOutput = error.join(' ');
      }
    }

    return errorOutput || '';
  },
};
