import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import SettingSelect from '@core/app/components/settings/components/SettingSelect';
import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import { hasSwiftray } from '@core/helpers/api/swiftray-client';
import useI18n from '@core/helpers/useI18n';

function Performance(): React.JSX.Element {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();

  const imageDownSamplingOptions = [
    { label: lang.settings.low, value: true },
    { label: lang.settings.normal, value: false },
  ] as unknown as DefaultOptionType[];

  return (
    <>
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
        checked={getPreference('simplify_clipper_path')}
        id="set-simplify-clipper-path"
        label={lang.settings.simplify_clipper_path}
        onChange={(e) => setPreference('simplify_clipper_path', e)}
        url={lang.settings.help_center_urls.simplify_clipper_path}
      />
      {hasSwiftray && (
        <SettingSwitch
          checked={getPreference('path-engine') === 'swiftray'}
          id="path-engine"
          label={`${lang.settings.calculation_optimization} (Beta)`}
          onChange={(e) => setPreference('path-engine', e ? 'swiftray' : 'fluxghost')}
          url={lang.settings.help_center_urls.calculation_optimization}
        />
      )}
    </>
  );
}

export default Performance;
