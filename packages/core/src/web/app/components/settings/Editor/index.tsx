import React from 'react';

import SettingsCard from '@core/app/components/settings/components/SettingsCard';
import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import useI18n from '@core/helpers/useI18n';

import Performance from './Performance';
import Text from './Text';
import Workarea from './Workarea';

interface Props {
  subSectionTitleClass?: string;
  unitInputProps: Partial<SettingUnitInputProps>;
  wrapped?: boolean;
}

function Editor({ subSectionTitleClass, unitInputProps, wrapped = false }: Props): React.JSX.Element {
  const lang = useI18n();

  if (!wrapped) {
    return (
      <>
        <Text />
        <Workarea unitInputProps={unitInputProps} />
        <Performance />
      </>
    );
  }

  return (
    <>
      <div className={subSectionTitleClass}>{lang.settings.groups.text}</div>
      <SettingsCard>
        <Text />
      </SettingsCard>
      <div className={subSectionTitleClass}>{lang.settings.groups.workarea}</div>
      <SettingsCard>
        <Workarea unitInputProps={unitInputProps} />
      </SettingsCard>
      <div className={subSectionTitleClass}>{lang.settings.groups.performance}</div>
      <SettingsCard>
        <Performance />
      </SettingsCard>
    </>
  );
}

export default Editor;
