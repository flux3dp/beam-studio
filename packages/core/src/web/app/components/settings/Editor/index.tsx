import React, { useState } from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import XYItem from '@core/app/components/settings/components/XYItem';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import { hasSwiftray } from '@core/helpers/api/swiftray-client';
import { checkBM2, checkFpm1, checkHxRf } from '@core/helpers/checkFeature';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';
import type { GeneralFont, IDefaultFont } from '@core/interfaces/IFont';

import SettingSelect from '../components/SettingSelect';

const fontFamilies = FontFuncs.requestAvailableFontFamilies(true);

interface Props {
  unitInputProps: Partial<SettingUnitInputProps>;
}

function Editor({ unitInputProps }: Props): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, getPreference, setConfig, setPreference } = useSettingStore();

  const selectedModel = getPreference('model');
  const workarea = getWorkarea(selectedModel);
  const [defaultFont, updateDefaultFont] = useState<IDefaultFont>(
    storage.get('default-font') || { family: 'Arial', style: 'Regular' },
  );

  const fontOptions = fontFamilies.map((family: string) => {
    const fontName = FontFuncs.fontNameMap.get(family);
    const label = typeof fontName === 'string' ? fontName : family;

    return { label, value: family };
  });
  const fontStyleOptions = FontFuncs
    //
    .requestFontsOfTheFontFamily(defaultFont.family)
    .map(({ postscriptName, style }) => ({ label: style, value: postscriptName }));

  const setFont = (family: string) => {
    const fonts: GeneralFont[] = FontFuncs.requestFontsOfTheFontFamily(family);
    const newDefaultFont: IDefaultFont = fonts.filter(({ style }) => style === 'Regular')[0] || fonts[0];

    storage.set('default-font', {
      family: newDefaultFont.family,
      postscriptName: newDefaultFont.postscriptName,
      style: newDefaultFont.style,
    });
    updateDefaultFont({
      family: newDefaultFont.family,
      postscriptName: newDefaultFont.postscriptName,
      style: newDefaultFont.style,
    });
  };
  const setFontStyle = (postscriptName: string) => {
    const newDefaultFont = FontFuncs.getFontOfPostscriptName(postscriptName);

    storage.set('default-font', {
      family: newDefaultFont.family,
      postscriptName: newDefaultFont.postscriptName,
      style: newDefaultFont.style,
    });
    updateDefaultFont({
      family: newDefaultFont.family,
      postscriptName: newDefaultFont.postscriptName,
      style: newDefaultFont.style,
    });
  };

  const modelOptions = [
    { label: 'beamo', value: 'fbm1' },
    checkBM2() && { label: 'beamo II', value: 'fbm2' },
    { label: 'Beambox', value: 'fbb1b' },
    { label: 'Beambox Pro', value: 'fbb1p' },
    { label: 'HEXA', value: 'fhexa1' },
    checkHxRf() && { label: 'HEXA RF', value: 'fhx2rf' },
    { label: 'Ador', value: 'ado1' },
    checkFpm1() && { label: 'Promark', value: 'fpm1' },
    isDev() && { label: 'Lazervida', value: 'flv1' },
    { label: 'Beambox II', value: 'fbb2' },
  ].filter(Boolean);

  const imageDownSamplingOptions = [
    { label: lang.settings.low, value: true },
    { label: lang.settings.normal, value: false },
  ] as unknown as DefaultOptionType[];
  const pathEngineOptions = [
    { label: lang.settings.on, value: 'swiftray' },
    { label: lang.settings.off, value: 'fluxghost' },
  ];
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
        defaultValue={defaultFont.family as string}
        id="set-default-font-family"
        label={lang.settings.default_font_family}
        onChange={(e) => setFont(e)}
        options={fontOptions}
      />
      <SettingSelect
        id="set-default-font-style"
        label={lang.settings.default_font_style}
        onChange={(e) => setFontStyle(e)}
        options={fontStyleOptions}
        value={(defaultFont.postscriptName ?? defaultFont.style) as string}
      />
      <SettingSelect
        defaultValue={getPreference('model')}
        id="set-default-model"
        label={lang.settings.default_beambox_model}
        onChange={(e) => setPreference('model', e)}
        options={modelOptions}
      />
      <SettingSwitch
        checked={getPreference('show_guides')}
        id="set-guide"
        label={lang.settings.guides}
        onChange={(e) => setPreference('show_guides', e)}
      />
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
      <SettingSelect
        defaultValue={getPreference('image_downsampling')}
        id="set-bitmap-quality"
        label={lang.settings.image_downsampling}
        onChange={(e) => setPreference('image_downsampling', e)}
        options={imageDownSamplingOptions}
        url={lang.settings.help_center_urls.image_downsampling}
      />
      <SettingSwitch
        checked={getPreference('anti-aliasing')}
        id="set-anti-aliasing"
        label={lang.settings.anti_aliasing}
        onChange={(e) => setPreference('anti-aliasing', e)}
        url={lang.settings.help_center_urls.anti_aliasing}
      />
      <SettingSwitch
        checked={getPreference('continuous_drawing')}
        id="set-continuous-drawing"
        label={lang.settings.continuous_drawing}
        onChange={(e) => setPreference('continuous_drawing', e)}
        url={lang.settings.help_center_urls.continuous_drawing}
      />
      <SettingSwitch
        checked={getPreference('simplify_clipper_path')}
        id="set-simplify-clipper-path"
        label={lang.settings.simplify_clipper_path}
        onChange={(e) => setPreference('simplify_clipper_path', e)}
        url={lang.settings.help_center_urls.simplify_clipper_path}
      />
      <SettingSwitch
        checked={getPreference('auto-switch-tab')}
        id="auto-switch-tab"
        label={lang.settings.auto_switch_tab}
        onChange={(e) => setPreference('auto-switch-tab', e)}
      />
      {hasSwiftray && (
        <SettingSelect
          defaultValue={getPreference('path-engine')}
          id="path-engine"
          label={`${lang.settings.calculation_optimization} (Beta)`}
          onChange={(e) => setPreference('path-engine', e)}
          options={pathEngineOptions}
          url={lang.settings.help_center_urls.calculation_optimization}
        />
      )}
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

export default Editor;
