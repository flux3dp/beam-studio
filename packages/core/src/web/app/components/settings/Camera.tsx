import React, { useMemo } from 'react';

import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import SelectControl from '@core/app/components/settings/SelectControl';
import type { OptionValues } from '@core/app/constants/enums';
import i18n from '@core/helpers/i18n';

interface Props {
  enableCustomPreviewHeightOptions: Array<{
    label: string;
    selected: boolean;
    value: OptionValues;
  }>;
  getBeamboxPreferenceEditingValue: (key: string) => any;
  keepPreviewResultOptions: Array<{ label: string; selected: boolean; value: OptionValues }>;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

function Camera({
  enableCustomPreviewHeightOptions,
  getBeamboxPreferenceEditingValue,
  keepPreviewResultOptions,
  updateBeamboxPreferenceChange,
}: Props): React.JSX.Element {
  const { lang } = i18n;
  const previewSpeedLevel = getBeamboxPreferenceEditingValue('preview_movement_speed_level') || 1;
  const options = useMemo(
    () => [
      {
        label: lang.settings.low,
        selected: previewSpeedLevel === PreviewSpeedLevel.SLOW,
        value: PreviewSpeedLevel.SLOW,
      },
      {
        label: lang.settings.medium,
        selected: previewSpeedLevel === PreviewSpeedLevel.MEDIUM,
        value: PreviewSpeedLevel.MEDIUM,
      },
      {
        label: lang.settings.high,
        selected: previewSpeedLevel === PreviewSpeedLevel.FAST,
        value: PreviewSpeedLevel.FAST,
      },
    ],
    [lang, previewSpeedLevel],
  );

  return (
    <>
      <div className="subtitle">{lang.settings.groups.camera}</div>
      <SelectControl
        id="set-camera-preview-speed-level"
        label={lang.settings.preview_movement_speed}
        onChange={(e) =>
          updateBeamboxPreferenceChange('preview_movement_speed_level', Number.parseInt(e.target.value, 10))
        }
        options={options}
      />
      <SelectControl
        id="set-enable-custom-preview-height"
        label={lang.settings.custom_preview_height}
        onChange={(e) => updateBeamboxPreferenceChange('enable-custom-preview-height', e.target.value)}
        options={enableCustomPreviewHeightOptions}
      />
      <SelectControl
        id="set-keep-preview-result"
        label={lang.settings.keep_preview_result}
        onChange={(e) => updateBeamboxPreferenceChange('keep-preview-result', e.target.value)}
        options={keepPreviewResultOptions}
      />
    </>
  );
}

export default Camera;
