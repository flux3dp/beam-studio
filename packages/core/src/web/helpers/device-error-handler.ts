import i18n from '@core/helpers/i18n';

type MonitorErrorKey = keyof typeof i18n.lang.monitor;

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

      // Attempt to find an exact match using progressively shorter keys:
      // [main key, optional sub key, detail key]
      for (let i = error.length; i >= 2; i -= 1) {
        errorOutput = lang.monitor[error.slice(0, i).join('_') as MonitorErrorKey] as string;

        if (errorOutput) return errorOutput;
      }

      if (error.length >= 2) {
        // Fallback 1:
        // Try using ['HARDWARE_ERROR', detail key] as an alias.
        // Firmware may return the same error with different main keys
        // depending on state or version, so we normalize to HARDWARE_ERROR.
        const aliasKey = 'HARDWARE_ERROR_' + error.at(-1);

        errorOutput = lang.monitor[aliasKey as MonitorErrorKey] as string;

        if (errorOutput) return errorOutput;
      }

      // Fallback 2:
      // Use only the main key.
      errorOutput = lang.monitor[error[0] as MonitorErrorKey] as string;

      if (errorOutput) return errorOutput;

      // Fallback 3:
      // Return the raw error key as a string.
      errorOutput = error.join(' ');
    }

    return errorOutput || '';
  },
};
