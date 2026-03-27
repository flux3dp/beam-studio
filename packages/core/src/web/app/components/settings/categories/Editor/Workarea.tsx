import React, { useMemo } from 'react';

import type { AnnotatedWorkareaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea, workareaOptions } from '@core/app/constants/workarea-constants';
import { decodeWorkareaAnnotation, encodeWorkareaAnnotation } from '@core/helpers/device/workarea-annotation';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import { SettingSelect, SettingSwitch, type SettingUnitInputProps, useSettingStore, XYItem } from '../../shared';

interface Props {
  unitInputProps: Partial<SettingUnitInputProps>;
}

function Workarea({ unitInputProps }: Props): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, getPreference, setConfig, setPreference } = useSettingStore();

  const initModel = useMemo(() => {
    const model = getPreference('model');
    const annotation = getPreference('model-annotation');

    return encodeWorkareaAnnotation(model, annotation);
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);
  const selectedModel = getPreference('model');
  const workarea = getWorkarea(selectedModel);
  const showGuides = getPreference('show_guides');

  const unitOptions = [
    { label: lang.menu.mm, value: 'mm' },
    { label: lang.menu.inches, value: 'inches' },
  ];

  return (
    <>
      <SettingSelect
        defaultValue={getConfig('default-units')}
        id="set-default-units"
        label={lang.settings.default_units}
        onChange={(e) => setConfig('default-units', e)}
        options={unitOptions}
      />
      <SettingSelect
        defaultValue={initModel}
        id="set-default-model"
        label={lang.settings.default_beambox_model}
        onChange={(e: AnnotatedWorkareaModel) => {
          const { annotation, workarea: newModel } = decodeWorkareaAnnotation(e);

          setPreference('model', newModel);
          setPreference('model-annotation', { ...getPreference('model-annotation'), ...annotation });
        }}
        options={workareaOptions}
      />
      <SettingSwitch
        checked={showGuides}
        id="set-guide"
        label={lang.settings.guides}
        onChange={(e) => setPreference('show_guides', e)}
      />
      {showGuides && (
        <XYItem
          id="set-guide-axis"
          label={lang.settings.guides_origin}
          maxX={workarea.width}
          maxY={workarea.displayHeight ?? workarea.height}
          minX={0}
          minY={0}
          onChange={(axis, val) => setPreference(`guide_${axis}0`, val)}
          unitInputProps={unitInputProps}
          values={[getPreference('guide_x0'), getPreference('guide_y0')]}
        />
      )}
      <SettingSwitch
        checked={getPreference('auto-switch-tab')}
        id="auto-switch-tab"
        label={lang.settings.auto_switch_tab}
        onChange={(e) => setPreference('auto-switch-tab', e)}
      />
      <SettingSwitch
        checked={getPreference('continuous_drawing')}
        id="set-continuous-drawing"
        label={lang.settings.continuous_drawing}
        onChange={(e) => setPreference('continuous_drawing', e)}
        url={lang.settings.help_center_urls.continuous_drawing}
      />
      {isDev() && (
        <SettingSwitch
          checked={getPreference('enable-custom-backlash')}
          id="set-enable-custom-backlash"
          label={lang.settings.enable_custom_backlash}
          onChange={(e) => setPreference('enable-custom-backlash', e)}
        />
      )}
      <SettingSwitch
        checked={getPreference('enable-uv-print-file')}
        id="set-enable-uv-print-file"
        label={lang.settings.enable_uv_print_file}
        onChange={(e) => setPreference('enable-uv-print-file', e)}
        url={lang.settings.help_center_urls.uv_print_export}
      />
      <SettingSwitch
        checked={getPreference('print-advanced-mode')}
        id="print-advanced-mode"
        label={lang.settings.printer_advanced_mode}
        onChange={(e) => setPreference('print-advanced-mode', e)}
      />
      <SettingSwitch
        checked={getPreference('use-real-boundary')}
        id="use-real-boundary"
        label={lang.settings.use_real_boundary}
        onChange={(e) => setPreference('use-real-boundary', e)}
        tooltip={lang.settings.use_real_boundary_tooltip}
      />
      <SettingSwitch
        checked={getPreference('crop-task-thumbnail')}
        id="crop-task-thumbnail"
        label={lang.settings.crop_task_thumbnail}
        onChange={(e) => setPreference('crop-task-thumbnail', e)}
        tooltip={lang.settings.crop_task_thumbnail_tooltip}
      />
    </>
  );
}

export default Workarea;
