import React, { useMemo, useState } from 'react';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import Controls from '@core/app/components/settings/Control';
import onOffOptionFactory from '@core/app/components/settings/onOffOptionFactory';
import SelectControl from '@core/app/components/settings/SelectControl';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { hasSwiftray } from '@core/helpers/api/swiftray-client';
import { checkFbb2, checkFpm1 } from '@core/helpers/checkFeature';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';
import type { FontDescriptor } from '@core/interfaces/IFont';
import type { StorageKey } from '@core/interfaces/IStorage';

import storage from '@app/implementations/storage';

const fontFamilies = FontFuncs.requestAvailableFontFamilies(true);

interface Props {
  defaultUnit: string;
  getBeamboxPreferenceEditingValue: (key: string) => any;
  selectedModel: WorkAreaModel;
  updateBeamboxPreferenceChange: (item_key: string, newVal: any) => void;
  updateConfigChange: (id: StorageKey, newVal: any) => void;
  updateModel: (selectedModel: WorkAreaModel) => void;
}

type SelectOption = { label: string; selected: boolean; value: string };

function Editor({
  defaultUnit,
  getBeamboxPreferenceEditingValue,
  selectedModel,
  updateBeamboxPreferenceChange,
  updateConfigChange,
  updateModel,
}: Props): React.JSX.Element {
  const lang = useI18n();
  const [defaultFont, updateDefaultFont] = useState(
    storage.get('default-font') || {
      family: 'Arial',
      style: 'Regular',
    },
  );

  const fontOptions: SelectOption[] = fontFamilies.map((family: string) => {
    const fontName = FontFuncs.fontNameMap.get(family);
    const label = typeof fontName === 'string' ? fontName : family;

    return {
      label,
      selected: family === defaultFont.family,
      value: family,
    };
  });
  const fontStyleOptions: SelectOption[] = FontFuncs.requestFontsOfTheFontFamily(defaultFont.family).map(
    (font: FontDescriptor) => ({
      label: font.style,
      selected: font.style === defaultFont.style,
      value: font.postscriptName,
    }),
  );

  const onSelectFont = (family: string) => {
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
  const onSelectFontStyle = (postscriptName: string) => {
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
      label: 'beamo',
      selected: selectedModel === 'fbm1',
      value: 'fbm1',
    },
    {
      label: 'Beambox',
      selected: selectedModel === 'fbb1b',
      value: 'fbb1b',
    },
    {
      label: 'Beambox Pro',
      selected: selectedModel === 'fbb1p',
      value: 'fbb1p',
    },
    {
      label: 'HEXA',
      selected: selectedModel === 'fhexa1',
      value: 'fhexa1',
    },
    {
      label: 'Ador',
      selected: selectedModel === 'ado1',
      value: 'ado1',
    },
    checkFpm1() && {
      label: 'Promark',
      selected: selectedModel === 'fpm1',
      value: 'fpm1',
    },
    isDevMode && {
      label: 'Lazervida',
      selected: selectedModel === 'flv1',
      value: 'flv1',
    },
    checkFbb2() && {
      label: 'Beambox II',
      selected: selectedModel === 'fbb2',
      value: 'fbb2',
    },
  ].filter(Boolean) as SelectOption[];
  const workarea = getWorkarea(selectedModel);

  const guideX = getBeamboxPreferenceEditingValue('guide_x0');
  const guideY = getBeamboxPreferenceEditingValue('guide_y0');

  const guideSelectionOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('show_guides') !== false, { lang });
  const imageDownsamplingOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('image_downsampling') !== false,
    { offLabel: lang.settings.normal, onLabel: lang.settings.low },
  );
  const antiAliasingOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('anti-aliasing'), { lang });
  const continuousDrawingOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('continuous_drawing'), { lang });
  const simplifyClipperPath = onOffOptionFactory(getBeamboxPreferenceEditingValue('simplify_clipper_path'), { lang });
  const autoSwitchTab = onOffOptionFactory(getBeamboxPreferenceEditingValue('auto-switch-tab'), {
    lang,
  });
  const enableCustomBacklashOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('enable-custom-backlash'), {
    lang,
  });

  const pathEngine = getBeamboxPreferenceEditingValue('path-engine') || 'fluxghost';
  const pathEngineOptions = [
    { label: lang.settings.on, selected: pathEngine === 'swiftray', value: 'swiftray' },
    { label: lang.settings.off, selected: pathEngine === 'fluxghost', value: 'fluxghost' },
  ];

  return (
    <>
      <div className="subtitle">{lang.settings.groups.editor}</div>
      <SelectControl
        id="set-default-units"
        label={lang.settings.default_units}
        onChange={(e) => updateConfigChange('default-units', e.target.value)}
        options={[
          {
            label: lang.menu.mm,
            selected: defaultUnit === 'mm',
            value: 'mm',
          },
          {
            label: lang.menu.inches,
            selected: defaultUnit === 'inches',
            value: 'inches',
          },
        ]}
      />
      <SelectControl
        id="set-default-font-family"
        label={lang.settings.default_font_family}
        onChange={(e) => onSelectFont(e.target.value)}
        options={fontOptions}
      />
      <SelectControl
        id="set-default-font-style"
        label={lang.settings.default_font_style}
        onChange={(e) => onSelectFontStyle(e.target.value)}
        options={fontStyleOptions}
      />
      <SelectControl
        id="set-default-model"
        label={lang.settings.default_beambox_model}
        onChange={(e) => {
          updateBeamboxPreferenceChange('model', e.target.value);
          updateModel(e.target.value);
        }}
        options={modelOptions}
      />
      <SelectControl
        id="set-guide"
        label={lang.settings.guides}
        onChange={(e) => updateBeamboxPreferenceChange('show_guides', e.target.value)}
        options={guideSelectionOptions}
      />
      <Controls label={lang.settings.guides_origin}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={guideX}
          forceUsePropsUnit
          getValue={(val) => updateBeamboxPreferenceChange('guide_x0', val)}
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
          defaultValue={guideY}
          forceUsePropsUnit
          getValue={(val) => updateBeamboxPreferenceChange('guide_y0', val)}
          id="guide-y-input"
          max={workarea.displayHeight ?? workarea.height}
          min={0}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </Controls>
      <SelectControl
        id="set-bitmap-quality"
        label={lang.settings.image_downsampling}
        onChange={(e) => updateBeamboxPreferenceChange('image_downsampling', e.target.value)}
        options={imageDownsamplingOptions}
        url={lang.settings.help_center_urls.image_downsampling}
      />
      <SelectControl
        id="set-anti-aliasing"
        label={lang.settings.anti_aliasing}
        onChange={(e) => updateBeamboxPreferenceChange('anti-aliasing', e.target.value)}
        options={antiAliasingOptions}
        url={lang.settings.help_center_urls.anti_aliasing}
      />
      <SelectControl
        id="set-continuous-drawingg"
        label={lang.settings.continuous_drawing}
        onChange={(e) => updateBeamboxPreferenceChange('continuous_drawing', e.target.value)}
        options={continuousDrawingOptions}
        url={lang.settings.help_center_urls.continuous_drawing}
      />
      <SelectControl
        id="set-simplify-clipper-path"
        label={lang.settings.simplify_clipper_path}
        onChange={(e) => updateBeamboxPreferenceChange('simplify_clipper_path', e.target.value)}
        options={simplifyClipperPath}
        url={lang.settings.help_center_urls.simplify_clipper_path}
      />
      <SelectControl
        id="auto-switch-tab"
        label={lang.settings.auto_switch_tab}
        onChange={(e) => updateBeamboxPreferenceChange('auto-switch-tab', e.target.value)}
        options={autoSwitchTab}
      />
      {hasSwiftray && (
        <SelectControl
          id="path-engine"
          label={`${lang.settings.calculation_optimization} (Beta)`}
          onChange={(e) => updateBeamboxPreferenceChange('path-engine', e.target.value)}
          options={pathEngineOptions}
          url={lang.settings.help_center_urls.calculation_optimization}
        />
      )}
      {isDevMode && (
        <SelectControl
          id="set-enable-custom-backlash"
          label={lang.settings.enable_custom_backlash}
          onChange={(e) => updateBeamboxPreferenceChange('enable-custom-backlash', e.target.value)}
          options={enableCustomBacklashOptions}
        />
      )}
    </>
  );
}

export default Editor;
