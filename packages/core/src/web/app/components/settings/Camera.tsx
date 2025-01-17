/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';

import i18n from 'helpers/i18n';
import SelectControl from 'app/components/settings/SelectControl';
import { OptionValues } from 'app/constants/enums';
import { PreviewSpeedLevel } from 'app/actions/beambox/constant';

interface Props {
  enableCustomPreviewHeightOptions: Array<{
    value: OptionValues;
    label: string;
    selected: boolean;
  }>;
  keepPreviewResultOptions: Array<{ value: OptionValues; label: string; selected: boolean }>;
  getBeamboxPreferenceEditingValue: (key: string) => any;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

function Camera({
  enableCustomPreviewHeightOptions,
  keepPreviewResultOptions,
  getBeamboxPreferenceEditingValue,
  updateBeamboxPreferenceChange,
}: Props): JSX.Element {
  const { lang } = i18n;
  const previewSpeedLevel = getBeamboxPreferenceEditingValue('preview_movement_speed_level') || 1;
  const options = useMemo(
    () => [
      {
        value: PreviewSpeedLevel.SLOW,
        label: lang.settings.low,
        selected: previewSpeedLevel === PreviewSpeedLevel.SLOW,
      },
      {
        value: PreviewSpeedLevel.MEDIUM,
        label: lang.settings.medium,
        selected: previewSpeedLevel === PreviewSpeedLevel.MEDIUM,
      },
      {
        value: PreviewSpeedLevel.FAST,
        label: lang.settings.high,
        selected: previewSpeedLevel === PreviewSpeedLevel.FAST,
      },
    ],
    [lang, previewSpeedLevel]
  );

  return (
    <>
      <div className="subtitle">{lang.settings.groups.camera}</div>
      <SelectControl
        id="set-camera-preview-speed-level"
        label={lang.settings.preview_movement_speed}
        options={options}
        onChange={(e) =>
          updateBeamboxPreferenceChange(
            'preview_movement_speed_level',
            parseInt(e.target.value, 10)
          )
        }
      />
      <SelectControl
        id="set-enable-custom-preview-height"
        label={lang.settings.custom_preview_height}
        options={enableCustomPreviewHeightOptions}
        onChange={(e) =>
          updateBeamboxPreferenceChange('enable-custom-preview-height', e.target.value)
        }
      />
      <SelectControl
        id="set-keep-preview-result"
        label={lang.settings.keep_preview_result}
        options={keepPreviewResultOptions}
        onChange={(e) => updateBeamboxPreferenceChange('keep-preview-result', e.target.value)}
      />
    </>
  );
}

export default Camera;
