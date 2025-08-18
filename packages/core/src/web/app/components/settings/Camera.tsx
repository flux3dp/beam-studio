import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingSelect from './components/SettingSelect';
import styles from './Settings.module.scss';

interface Props {
  options: DefaultOptionType[];
}

function Camera({ options }: Props): React.JSX.Element {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();
  const previewMovementSpeedOptions = [
    { label: lang.settings.low, value: PreviewSpeedLevel.SLOW },
    { label: lang.settings.medium, value: PreviewSpeedLevel.MEDIUM },
    { label: lang.settings.high, value: PreviewSpeedLevel.FAST },
  ];

  return (
    <>
      <div className={styles.subtitle}>{lang.settings.groups.camera}</div>
      <SettingSelect
        defaultValue={getPreference('preview_movement_speed_level')}
        id="set-camera-preview-speed-level"
        label={lang.settings.preview_movement_speed}
        onChange={(e) => setPreference('preview_movement_speed_level', Number.parseInt(e, 10))}
        options={previewMovementSpeedOptions}
      />
      <SettingSelect
        defaultValue={getPreference('enable-custom-preview-height')}
        id="set-enable-custom-preview-height"
        label={lang.settings.custom_preview_height}
        onChange={(e) => setPreference('enable-custom-preview-height', e)}
        options={options}
      />
      <SettingSelect
        defaultValue={getPreference('keep-preview-result')}
        id="set-keep-preview-result"
        label={lang.settings.keep_preview_result}
        onChange={(e) => setPreference('keep-preview-result', e)}
        options={options}
      />
    </>
  );
}

export default Camera;
