import React from 'react';

import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import i18n from '@core/helpers/i18n';
import { mockT } from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';

import { AboutInfo, SettingsCard, SettingSelect, SettingSwitch, useSettingStore } from '../shared';

interface Props {
  changeActiveLang: (val: string) => void;
  supportedLangs: Record<string, string>;
  wrapped?: boolean;
}

function General({ changeActiveLang, supportedLangs, wrapped = false }: Props): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, getPreference, setConfig, setPreference } = useSettingStore();
  const langOptions = Object.keys(supportedLangs).map((value) => ({ label: supportedLangs[value], value }));

  const Wrapper = wrapped ? SettingsCard : React.Fragment;

  return (
    <>
      {!isWeb() && (
        <Wrapper>
          <AboutInfo />
          <SettingSwitch
            checked={getConfig('auto_check_update')}
            id="set-auto-update"
            label={lang.settings.check_updates}
            onChange={(e) => setConfig('auto_check_update', e)}
          />
        </Wrapper>
      )}
      <Wrapper>
        <SettingSelect
          defaultValue={i18n.getActiveLang()}
          id="select-lang"
          label={lang.settings.language}
          onChange={changeActiveLang}
          options={langOptions}
        />
      </Wrapper>
      <Wrapper>
        <SettingSwitch
          checked={getPreference('template_creation_mode')}
          icon={<ObjectPanelIcons.Editable />}
          id="template_creation_mode"
          label={mockT('Template Creation Mode')}
          onChange={(e) => setPreference('template_creation_mode', e)}
        />
      </Wrapper>
      {!isWeb() && (
        <Wrapper>
          <SettingSwitch
            checked={getConfig('notification')}
            id="set-notifications"
            label={lang.settings.notifications}
            onChange={(e) => setConfig('notification', e)}
          />
        </Wrapper>
      )}
      <Wrapper>
        <SettingSwitch
          checked={getPreference('show_banners')}
          id="set-show-banners"
          label={lang.settings.show_banners}
          onChange={(e) => setPreference('show_banners', e)}
        />
      </Wrapper>
    </>
  );
}

export default General;
