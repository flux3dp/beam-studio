import React from 'react';

import { DEFAULT_ERROR_REPORT_PREFERENCE } from '@core/helpers/error-report/preference';
import useI18n from '@core/helpers/useI18n';

import { SettingSelect, SettingSwitch, useSettingStore } from '../shared';

function Privacy(): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, setConfig } = useSettingStore();

  return (
    <>
      <SettingSwitch
        checked={getConfig('enable-sentry')}
        id="set-sentry"
        label={lang.settings.share_with_flux}
        onChange={(e) => setConfig('enable-sentry', e)}
      />
      <SettingSelect
        id="set-error-report-upload"
        label={lang.error_report.setting_label}
        onChange={(value) => setConfig('error-report-upload', value)}
        options={[
          { label: lang.error_report.always, value: 'always' },
          { label: lang.error_report.ask, value: 'ask' },
          { label: lang.error_report.never, value: 'never' },
        ]}
        value={getConfig('error-report-upload') ?? DEFAULT_ERROR_REPORT_PREFERENCE}
      />
    </>
  );
}

export default Privacy;
