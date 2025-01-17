/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';

import Controls from 'app/components/settings/Control';
import FontFuncs from 'app/actions/beambox/font-funcs';
import isDev from 'helpers/is-dev';
import localeHelper from 'helpers/locale-helper';
import onOffOptionFactory from 'app/components/settings/onOffOptionFactory';
import SelectControl from 'app/components/settings/SelectControl';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';
import { FontDescriptor } from 'interfaces/IFont';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { hasSwiftray } from 'helpers/api/swiftray-client';
import { StorageKey } from 'interfaces/IStorage';

const fontFamilies = FontFuncs.requestAvailableFontFamilies(true);

interface Props {
  defaultUnit: string;
  selectedModel: WorkAreaModel;
  getBeamboxPreferenceEditingValue: (key: string) => any;
  updateConfigChange: (id: StorageKey, newVal: any) => void;
  updateBeamboxPreferenceChange: (item_key: string, newVal: any) => void;
  updateModel: (selectedModel: WorkAreaModel) => void;
}

type SelectOption = { value: string; label: string; selected: boolean };

function Editor({
  defaultUnit,
  selectedModel,
  getBeamboxPreferenceEditingValue,
  updateConfigChange,
  updateBeamboxPreferenceChange,
  updateModel,
}: Props): JSX.Element {
  const lang = useI18n();
  const [defaultFont, updateDefaultFont] = useState(
    storage.get('default-font') || {
      family: 'Arial',
      style: 'Regular',
    }
  );

  const fontOptions: SelectOption[] = fontFamilies.map((family: string) => {
    const fontName = FontFuncs.fontNameMap.get(family);
    const label = typeof fontName === 'string' ? fontName : family;
    return {
      value: family,
      label,
      selected: family === defaultFont.family,
    };
  });
  const fontStyleOptions: SelectOption[] = FontFuncs.requestFontsOfTheFontFamily(
    defaultFont.family
  ).map((font: FontDescriptor) => ({
    value: font.postscriptName,
    label: font.style,
    selected: font.style === defaultFont.style,
  }));

  const onSelectFont = (family) => {
    const fonts: FontDescriptor[] = FontFuncs.requestFontsOfTheFontFamily(family);
    const newDefaultFont = fonts.filter((font) => font.style === 'Regular')[0] || fonts[0];
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
  const onSelectFontStyle = (postscriptName) => {
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

  const isDevMode = useMemo(() => isDev(), []);

  const modelOptions = [
    {
      value: 'fbm1',
      label: 'beamo',
      selected: selectedModel === 'fbm1',
    },
    {
      value: 'fbb1b',
      label: 'Beambox',
      selected: selectedModel === 'fbb1b',
    },
    {
      value: 'fbb1p',
      label: 'Beambox Pro',
      selected: selectedModel === 'fbb1p',
    },
    {
      value: 'fhexa1',
      label: 'HEXA',
      selected: selectedModel === 'fhexa1',
    },
    {
      value: 'ado1',
      label: 'Ador',
      selected: selectedModel === 'ado1',
    },
    (isDevMode || localeHelper.isTwOrHk) && {
      value: 'fpm1',
      label: 'Promark',
      selected: selectedModel === 'fpm1',
    },
    isDevMode && {
      value: 'flv1',
      label: 'Lazervida',
      selected: selectedModel === 'flv1',
    },
    (isDevMode || localeHelper.isTwOrHk || localeHelper.isJp) && {
      value: 'fbb2',
      label: 'Beambox II',
      selected: selectedModel === 'fbb2',
    },
  ].filter(Boolean);
  const workarea = getWorkarea(selectedModel);

  const guideX = getBeamboxPreferenceEditingValue('guide_x0');
  const guideY = getBeamboxPreferenceEditingValue('guide_y0');

  const guideSelectionOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('show_guides') !== false,
    { lang }
  );
  const imageDownsamplingOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('image_downsampling') !== false,
    { onLabel: lang.settings.low, offLabel: lang.settings.normal }
  );
  const antiAliasingOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('anti-aliasing'),
    { lang }
  );
  const continuousDrawingOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('continuous_drawing'),
    { lang }
  );
  const simplifyClipperPath = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('simplify_clipper_path'),
    { lang }
  );
  const enableLowSpeedOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('enable-low-speed'),
    { lang }
  );
  const autoSwitchTab = onOffOptionFactory(getBeamboxPreferenceEditingValue('auto-switch-tab'), {
    lang,
  });
  const enableCustomBacklashOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('enable-custom-backlash'),
    { lang }
  );

  const pathEngine = getBeamboxPreferenceEditingValue('path-engine') || 'fluxghost';
  const pathEngineOptions = [
    { value: 'swiftray', label: lang.settings.on, selected: pathEngine === 'swiftray' },
    { value: 'fluxghost', label: lang.settings.off, selected: pathEngine === 'fluxghost' },
  ];

  return (
    <>
      <div className="subtitle">{lang.settings.groups.editor}</div>
      <SelectControl
        id="set-default-units"
        label={lang.settings.default_units}
        options={[
          {
            value: 'mm',
            label: lang.menu.mm,
            selected: defaultUnit === 'mm',
          },
          {
            value: 'inches',
            label: lang.menu.inches,
            selected: defaultUnit === 'inches',
          },
        ]}
        onChange={(e) => updateConfigChange('default-units', e.target.value)}
      />
      <SelectControl
        id="set-default-font-family"
        label={lang.settings.default_font_family}
        options={fontOptions}
        onChange={(e) => onSelectFont(e.target.value)}
      />
      <SelectControl
        id="set-default-font-style"
        label={lang.settings.default_font_style}
        options={fontStyleOptions}
        onChange={(e) => onSelectFontStyle(e.target.value)}
      />
      <SelectControl
        id="set-default-model"
        label={lang.settings.default_beambox_model}
        options={modelOptions}
        onChange={(e) => {
          updateBeamboxPreferenceChange('model', e.target.value);
          updateModel(e.target.value);
        }}
      />
      <SelectControl
        label={lang.settings.guides}
        id="set-guide"
        options={guideSelectionOptions}
        onChange={(e) => updateBeamboxPreferenceChange('show_guides', e.target.value)}
      />
      <Controls label={lang.settings.guides_origin}>
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          X
        </span>
        <UnitInput
          id="guide-x-input"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={0}
          max={workarea.width}
          defaultValue={guideX}
          getValue={(val) => updateBeamboxPreferenceChange('guide_x0', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          Y
        </span>
        <UnitInput
          id="guide-y-input"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={0}
          max={workarea.displayHeight ?? workarea.height}
          defaultValue={guideY}
          getValue={(val) => updateBeamboxPreferenceChange('guide_y0', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
      </Controls>
      <SelectControl
        id="set-bitmap-quality"
        label={lang.settings.image_downsampling}
        url={lang.settings.help_center_urls.image_downsampling}
        options={imageDownsamplingOptions}
        onChange={(e) => updateBeamboxPreferenceChange('image_downsampling', e.target.value)}
      />
      <SelectControl
        id="set-anti-aliasing"
        label={lang.settings.anti_aliasing}
        url={lang.settings.help_center_urls.anti_aliasing}
        options={antiAliasingOptions}
        onChange={(e) => updateBeamboxPreferenceChange('anti-aliasing', e.target.value)}
      />
      <SelectControl
        id="set-continuous-drawingg"
        label={lang.settings.continuous_drawing}
        url={lang.settings.help_center_urls.continuous_drawing}
        options={continuousDrawingOptions}
        onChange={(e) => updateBeamboxPreferenceChange('continuous_drawing', e.target.value)}
      />
      <SelectControl
        id="set-simplify-clipper-path"
        label={lang.settings.simplify_clipper_path}
        url={lang.settings.help_center_urls.simplify_clipper_path}
        options={simplifyClipperPath}
        onChange={(e) => updateBeamboxPreferenceChange('simplify_clipper_path', e.target.value)}
      />
      <SelectControl
        id="set-enable-low-speed"
        label={lang.settings.enable_low_speed}
        options={enableLowSpeedOptions}
        onChange={(e) => updateBeamboxPreferenceChange('enable-low-speed', e.target.value)}
      />
      <SelectControl
        id="auto-switch-tab"
        label={lang.settings.auto_switch_tab}
        options={autoSwitchTab}
        onChange={(e) => updateBeamboxPreferenceChange('auto-switch-tab', e.target.value)}
      />
      {hasSwiftray && (
        <SelectControl
          id="path-engine"
          label={`${lang.settings.calculation_optimization} (Beta)`}
          url={lang.settings.help_center_urls.calculation_optimization}
          options={pathEngineOptions}
          onChange={(e) => updateBeamboxPreferenceChange('path-engine', e.target.value)}
        />
      )}
      {isDevMode && (
        <SelectControl
          id="set-enable-custom-backlash"
          label={lang.settings.enable_custom_backlash}
          options={enableCustomBacklashOptions}
          onChange={(e) => updateBeamboxPreferenceChange('enable-custom-backlash', e.target.value)}
        />
      )}
    </>
  );
}

export default Editor;
