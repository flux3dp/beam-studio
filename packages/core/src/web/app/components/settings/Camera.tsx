import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import i18n from '@core/helpers/i18n';

import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

function Camera({ options }: Props): React.JSX.Element {
  const { lang } = i18n;
  const get = useSettingStore((state) => state.getPreference);
  const update = useSettingStore((state) => state.setPreference);
  const previewMovementSpeedOptions = [
    { label: lang.settings.low, value: PreviewSpeedLevel.SLOW },
    { label: lang.settings.medium, value: PreviewSpeedLevel.MEDIUM },
    { label: lang.settings.high, value: PreviewSpeedLevel.FAST },
  ];

  return (
    <>
      <div className="subtitle">{lang.settings.groups.camera}</div>
      <SettingSelect
        defaultValue={get('preview_movement_speed_level')}
        id="set-camera-preview-speed-level"
        label={lang.settings.preview_movement_speed}
        onChange={(e) => update('preview_movement_speed_level', Number.parseInt(e, 10))}
        options={previewMovementSpeedOptions}
      />
      <SettingSelect
        defaultValue={get('enable-custom-preview-height')}
        id="set-enable-custom-preview-height"
        label={lang.settings.custom_preview_height}
        onChange={(e) => update('enable-custom-preview-height', e)}
        options={options}
      />
      <SettingSelect
        defaultValue={get('keep-preview-result')}
        id="set-keep-preview-result"
        label={lang.settings.keep_preview_result}
        onChange={(e) => update('keep-preview-result', e)}
        options={options}
      />
    </>
  );
}

export default Camera;
