/**
 * Attaches the diagnostic-upload consent to an error alert (docs/prd/error-report-upload §7.1, §7.6).
 * Pure over the IAlert config: the popup site does `alertCaller.popUp(withErrorReportConsent(alert, { errorCode }))`.
 * §7.1.1 isolation: any failure in here returns the original alert untouched.
 */
import React from 'react';

import { Typography } from 'antd';
import { match } from 'ts-pattern';

import i18n from '@core/helpers/i18n';
import Logger from '@core/helpers/logger';
import type { IAlert } from '@core/interfaces/IAlert';

import { getErrorReportPreference } from './preference';

import type { UploadErrorReportOptions } from './index';
import { getUploadBlock, uploadErrorReport } from './index';

const logger = Logger('generic');

const statusLine = (): React.ReactNode => (
  <Typography.Text style={{ display: 'block', fontSize: 12, marginTop: 10 }} type="secondary">
    {i18n.lang.error_report.sent_automatically}
  </Typography.Text>
);

export const withErrorReportConsent = (alert: IAlert, options: UploadErrorReportOptions): IAlert => {
  try {
    const preference = getErrorReportPreference();

    if (preference === 'never' || getUploadBlock(options.errorCode)) return alert;

    return match(preference)
      .with('always', () => {
        void uploadErrorReport(options);

        return {
          ...alert,
          children: (
            <>
              {alert.children}
              {statusLine()}
            </>
          ),
        };
      })
      .with('ask', () =>
        // one checkbox per alert (§7.4 rule): an existing one wins
        alert.checkbox
          ? alert
          : {
              ...alert,
              alwaysTriggerCheckboxCallbacks: true,
              checkbox: {
                // function form: runs on any button, and the button's own onClick still runs after it
                callbacks: () => void uploadErrorReport(options),
                text: i18n.lang.error_report.consent_checkbox,
              },
            },
      )
      .exhaustive();
  } catch (error) {
    logger.append(`error-report consent skipped ${options.errorCode}: ${error}`);

    return alert;
  }
};
