/**
 * Attaches the diagnostic-upload consent to an error alert (docs/prd/error-report-upload §7.1, §7.6).
 * Pure over the IAlert config: the popup site does `alertCaller.popUp(withErrorReportConsent(alert, { errorCode }))`.
 * §7.1.1 isolation: any failure in here returns the original alert untouched.
 */
import React from 'react';

import { Typography } from 'antd';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import i18n from '@core/helpers/i18n';
import Logger from '@core/helpers/logger';
import type { IAlert } from '@core/interfaces/IAlert';

import { getErrorReportPreference, hasChosenErrorReportPreference, setErrorReportPreference } from './preference';

import type { UploadErrorReportOptions } from './index';
import { getUploadBlock, uploadErrorReport } from './index';

const logger = Logger('generic');

const statusLine = (): React.ReactNode => (
  <Typography.Text style={{ display: 'block', fontSize: 12, marginTop: 10 }} type="secondary">
    {i18n.lang.error_report.sent_automatically}
  </Typography.Text>
);

/** §7.6: after the first consented upload ever, offer to make it automatic. Escape stores nothing. */
const promptAlways = (): void => {
  const lang = i18n.lang.error_report;

  alertCaller.popUp({
    buttonLabels: [lang.ask, lang.always],
    callbacks: [() => setErrorReportPreference('ask'), () => setErrorReportPreference('always')],
    caption: lang.prompt_caption,
    id: 'error-report-always-prompt',
    message: lang.prompt_message,
    primaryButtonIndex: 1,
  });
};

/** Ask path: upload, then the neutral toast and, when no preference was ever chosen, the prompt. */
const uploadWithFeedback = async (options: UploadErrorReportOptions): Promise<void> => {
  try {
    if ((await uploadErrorReport(options)) !== 'sent') return;

    MessageCaller.openMessage({
      content: i18n.lang.error_report.sent,
      duration: 3,
      key: 'error-report-sent',
      level: MessageLevel.SUCCESS,
    });

    // checked after the upload: a value picked in Settings meanwhile must not be overwritten
    if (!hasChosenErrorReportPreference()) promptAlways();
  } catch (error) {
    logger.append(`error-report feedback skipped ${options.errorCode}: ${error}`);
  }
};

export const withErrorReportConsent = (alert: IAlert, options: UploadErrorReportOptions): IAlert => {
  try {
    const preference = getErrorReportPreference();

    if (preference === 'never' || getUploadBlock(options)) return alert;

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
                callbacks: () => void uploadWithFeedback(options),
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
