import React from 'react';

import useI18n from '@core/helpers/useI18n';

import { SettingsCard, type SettingUnitInputProps } from '../../shared';

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
        <Workarea unitInputProps={unitInputProps} />
        <Text />
        <Performance />
      </>
    );
  }

  return (
    <>
      <div className={subSectionTitleClass}>{lang.settings.groups.workarea}</div>
      <SettingsCard>
        <Workarea unitInputProps={unitInputProps} />
      </SettingsCard>
      <div className={subSectionTitleClass}>{lang.settings.groups.text}</div>
      <SettingsCard>
        <Text />
      </SettingsCard>
      <div className={subSectionTitleClass}>{lang.settings.groups.performance}</div>
      <SettingsCard>
        <Performance />
      </SettingsCard>
    </>
  );
}

export default Editor;
