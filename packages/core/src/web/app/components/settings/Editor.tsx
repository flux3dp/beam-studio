import React, { useState } from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { hasSwiftray } from '@core/helpers/api/swiftray-client';
import { checkFpm1, checkHxRf } from '@core/helpers/checkFeature';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';
import type { FontDescriptor } from '@core/interfaces/IFont';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';

const fontFamilies = FontFuncs.requestAvailableFontFamilies(true);

interface Props {
  options: DefaultOptionType[];
  // getPreference<Key extends BeamboxPreferenceKey>(key: Key): BeamboxPreferenceValue<Key>;
  // selectedModel: WorkAreaModel;
  // updatePreference<Key extends BeamboxPreferenceKey>(key: Key, newVal: BeamboxPreferenceValue<Key>): void;
  // setConfig: (id: StorageKey, newVal: any) => void;
  // updateModel: (selectedModel: WorkAreaModel) => void;
}

function Editor({ options }: Props): React.JSX.Element {
  const lang = useI18n();
  const getPreference = useSettingStore((state) => state.getPreference);
  const updatePreference = useSettingStore((state) => state.setPreference);
  const getConfig = useSettingStore((state) => state.getConfig);
  const setConfig = useSettingStore((state) => state.setConfig);

  const selectedModel = getPreference('model');
  const defaultUnit = getConfig('default-units');
  const workarea = getWorkarea(selectedModel);
  const [defaultFont, updateDefaultFont] = useState<FontDescriptor>(
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
    .map(({ postscriptName, style }: FontDescriptor) => ({ label: style, value: postscriptName }));

  const setFont = (family: string) => {
    const fonts: FontDescriptor[] = FontFuncs.requestFontsOfTheFontFamily(family);
    const newDefaultFont = fonts.filter(({ style }) => style === 'Regular')[0] || fonts[0];

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
    { label: 'Beambox', value: 'fbb1b' },
    { label: 'Beambox Pro', value: 'fbb1p' },
    { label: 'HEXA', value: 'fhexa1' },
    checkHxRf() && {
      label: 'HEXA RF',
      // send to rf3 for now since they don't have different workarea at the moment
      value: 'fhx2rf3',
    },
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
      <div className="subtitle">{lang.settings.groups.editor}</div>
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
        defaultValue={defaultFont.style as string}
        id="set-default-font-style"
        label={lang.settings.default_font_style}
        onChange={(e) => setFontStyle(e)}
        options={fontStyleOptions}
      />
      <SettingSelect
        defaultValue={getPreference('model')}
        id="set-default-model"
        label={lang.settings.default_beambox_model}
        onChange={(e) => updatePreference('model', e)}
        options={modelOptions}
      />
      <SettingSelect
        defaultValue={getPreference('show_guides')}
        id="set-guide"
        label={lang.settings.guides}
        onChange={(e) => updatePreference('show_guides', e)}
        options={options}
      />
      <SettingFormItem id="set-guide-axis" label={lang.settings.guides_origin}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getPreference('guide_x0')}
          forceUsePropsUnit
          getValue={(val) => updatePreference('guide_x0', val)}
          id="guide-x-input"
          max={workarea.width}
          min={0}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          Y
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getPreference('guide_y0')}
          forceUsePropsUnit
          getValue={(val) => updatePreference('guide_y0', val)}
          id="guide-y-input"
          max={workarea.displayHeight ?? workarea.height}
          min={0}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </SettingFormItem>
      <SettingSelect
        defaultValue={getPreference('image_downsampling')}
        id="set-bitmap-quality"
        label={lang.settings.image_downsampling}
        onChange={(e) => updatePreference('image_downsampling', e)}
        options={imageDownSamplingOptions}
        url={lang.settings.help_center_urls.image_downsampling}
      />
      <SettingSelect
        defaultValue={getPreference('anti-aliasing')}
        id="set-anti-aliasing"
        label={lang.settings.anti_aliasing}
        onChange={(e) => updatePreference('anti-aliasing', e)}
        options={options}
        url={lang.settings.help_center_urls.anti_aliasing}
      />
      <SettingSelect
        defaultValue={getPreference('continuous_drawing')}
        id="set-continuous-drawing"
        label={lang.settings.continuous_drawing}
        onChange={(e) => updatePreference('continuous_drawing', e)}
        options={options}
        url={lang.settings.help_center_urls.continuous_drawing}
      />
      <SettingSelect
        defaultValue={getPreference('simplify_clipper_path')}
        id="set-simplify-clipper-path"
        label={lang.settings.simplify_clipper_path}
        onChange={(e) => updatePreference('simplify_clipper_path', e)}
        options={options}
        url={lang.settings.help_center_urls.simplify_clipper_path}
      />
      <SettingSelect
        defaultValue={getPreference('auto-switch-tab')}
        id="auto-switch-tab"
        label={lang.settings.auto_switch_tab}
        onChange={(e) => updatePreference('auto-switch-tab', e)}
        options={options}
      />
      {hasSwiftray && (
        <SettingSelect
          defaultValue={getPreference('path-engine')}
          id="path-engine"
          label={`${lang.settings.calculation_optimization} (Beta)`}
          onChange={(e) => updatePreference('path-engine', e)}
          options={pathEngineOptions}
          url={lang.settings.help_center_urls.calculation_optimization}
        />
      )}
      {isDev() && (
        <SettingSelect
          defaultValue={getPreference('enable-custom-backlash')}
          id="set-enable-custom-backlash"
          label={lang.settings.enable_custom_backlash}
          onChange={(e) => updatePreference('enable-custom-backlash', e)}
          options={options}
        />
      )}
    </>
  );
}

export default Editor;
