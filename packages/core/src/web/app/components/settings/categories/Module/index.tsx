import React, { useState } from 'react';

import { match } from 'ts-pattern';

import type { WorkAreaLabel, WorkAreaModel } from '@core/app/constants/workarea-constants';
import { checkBM2 } from '@core/helpers/checkFeature';
import useI18n from '@core/helpers/useI18n';

import { SettingsCard, SettingSelect, type SettingUnitInputProps } from '../../shared';

import AdorSettings from './AdorSettings';
import BB2Settings from './BB2Settings';
import Beamo2Settings from './Beamo2Settings';
import BeamoSettings from './BeamoSettings';

interface Props {
  subSectionTitleClass?: string;
  unitInputProps: Partial<SettingUnitInputProps>;
  wrapped?: boolean;
}

function Module({ subSectionTitleClass, unitInputProps, wrapped = false }: Props): React.JSX.Element {
  const lang = useI18n();
  const [selectedModule, setSelectedModule] = useState<WorkAreaModel>('fbm1');
  const moduleOptions: Array<{ label: WorkAreaLabel; value: WorkAreaModel }> = [
    { label: 'Ador', value: 'ado1' },
    { label: 'beamo', value: 'fbm1' },
    checkBM2() && { label: 'beamo II', value: 'fbm2' },
    { label: 'Beambox II', value: 'fbb2' },
  ].filter(Boolean);

  const renderModuleSettings = () =>
    match(selectedModule)
      .with('fbm1', () => <BeamoSettings unitInputProps={unitInputProps} />)
      .with('ado1', () => <AdorSettings unitInputProps={unitInputProps} />)
      .with('fbm2', () => <Beamo2Settings />)
      .with('fbb2', () => <BB2Settings />)
      .otherwise(() => null);

  if (!wrapped) {
    return (
      <>
        <SettingSelect
          defaultValue={selectedModule}
          id="module-selector"
          label={lang.settings.groups.module_type}
          onChange={(value) => setSelectedModule(value as WorkAreaModel)}
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
          onChange={(value) => setSelectedModule(value as WorkAreaModel)}
          options={moduleOptions}
        />
      </SettingsCard>
      <div className={subSectionTitleClass}>{lang.settings.groups.module_settings}</div>
      <SettingsCard>{renderModuleSettings()}</SettingsCard>
    </>
  );
}

export default Module;
