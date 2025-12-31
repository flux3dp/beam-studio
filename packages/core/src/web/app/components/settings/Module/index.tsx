import React, { useState } from 'react';

import { match } from 'ts-pattern';

import SettingsCard from '@core/app/components/settings/components/SettingsCard';
import SettingSelect from '@core/app/components/settings/components/SettingSelect';
import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import useI18n from '@core/helpers/useI18n';

import AdorSettings from './AdorSettings';
import BB2Settings from './BB2Settings';
import Beamo2Settings from './Beamo2Settings';
import BeamoSettings from './BeamoSettings';

type ModuleType = 'ador' | 'bb2' | 'beamo2' | 'beamo';

interface Props {
  subSectionTitleClass?: string;
  unitInputProps: Partial<SettingUnitInputProps>;
  wrapped?: boolean;
}

const Module = ({ subSectionTitleClass, unitInputProps, wrapped = false }: Props): React.JSX.Element => {
  const lang = useI18n();
  const [selectedModule, setSelectedModule] = useState<ModuleType>('beamo');

  const moduleOptions = [
    { label: 'Beamo', value: 'beamo' },
    { label: 'Ador', value: 'ador' },
    { label: 'Beamo II', value: 'beamo2' },
    { label: 'Beambox II', value: 'bb2' },
  ];

  const renderModuleSettings = () =>
    match(selectedModule)
      .with('beamo', () => <BeamoSettings unitInputProps={unitInputProps} />)
      .with('ador', () => <AdorSettings unitInputProps={unitInputProps} />)
      .with('beamo2', () => <Beamo2Settings />)
      .with('bb2', () => <BB2Settings />)
      .exhaustive();

  if (!wrapped) {
    return (
      <>
        <SettingSelect
          defaultValue={selectedModule}
          id="module-selector"
          label={lang.settings.groups.module_type}
          onChange={(value) => setSelectedModule(value as ModuleType)}
          options={moduleOptions}
        />
        {renderModuleSettings()}
      </>
    );
  }

  return (
    <>
      <SettingsCard>
        <SettingSelect
          defaultValue={selectedModule}
          id="module-selector"
          label={lang.settings.groups.module_type}
          onChange={(value) => setSelectedModule(value as ModuleType)}
          options={moduleOptions}
        />
      </SettingsCard>
      <div className={subSectionTitleClass}>{lang.settings.groups.module_settings}</div>
      <SettingsCard>{renderModuleSettings()}</SettingsCard>
    </>
  );
};

export default Module;
