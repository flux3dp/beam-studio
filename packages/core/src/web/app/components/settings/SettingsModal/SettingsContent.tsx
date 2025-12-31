import React from 'react';

import { ConfigProvider, Form } from 'antd';
import { match } from 'ts-pattern';

import AdorModule from '../AdorModule';
import AutoSave from '../AutoSave';
import BB2Settings from '../BB2Settings';
import Beamo2Module from '../Beamo2Module';
import Camera from '../Camera';
import SettingsCard from '../components/SettingsCard';
import Connection from '../Connection';
import Editor from '../Editor';
import Engraving from '../Engraving';
import Experimental from '../Experimental';
import General from '../General';
import Module from '../Module';
import Path from '../Path';
import Privacy from '../Privacy';
import TextToPath from '../TextToPath';

import styles from './SettingsModal.module.scss';
import type { CommonSettingProps, SettingCategoryConfig } from './types';
import { SettingCategory } from './types';

interface SettingsContentProps {
  category: SettingCategory;
  categoryConfig: SettingCategoryConfig | undefined;
  commonProps: CommonSettingProps;
}

const SettingsContent = ({ category, categoryConfig, commonProps }: SettingsContentProps): React.JSX.Element => {
  const {
    changeActiveLang,
    editingAutosaveConfig,
    setEditingAutosaveConfig,
    setWarnings,
    supportedLangs,
    unitInputProps,
    warnings,
  } = commonProps;

  const renderSection = (): React.ReactNode =>
    match(category)
      .with(SettingCategory.GENERAL, () => (
        <General changeActiveLang={changeActiveLang} supportedLangs={supportedLangs} wrapped />
      ))
      .with(SettingCategory.CONNECTION, () => <Connection />)
      .with(SettingCategory.AUTOSAVE, () => (
        <AutoSave
          editingAutosaveConfig={editingAutosaveConfig}
          setEditingAutosaveConfig={setEditingAutosaveConfig}
          setWarnings={setWarnings}
          warnings={warnings}
        />
      ))
      .with(SettingCategory.CAMERA, () => <Camera />)
      .with(SettingCategory.EDITOR, () => <Editor unitInputProps={unitInputProps} />)
      .with(SettingCategory.ENGRAVING, () => <Engraving />)
      .with(SettingCategory.PATH, () => <Path unitInputProps={unitInputProps} />)
      .with(SettingCategory.TEXT_TO_PATH, () => <TextToPath />)
      .with(SettingCategory.MODULE, () => <Module unitInputProps={unitInputProps} />)
      .with(SettingCategory.ADOR_MODULE, () => <AdorModule unitInputProps={unitInputProps} />)
      .with(SettingCategory.BEAMO2_MODULE, () => <Beamo2Module />)
      .with(SettingCategory.BB2_SETTINGS, () => <BB2Settings />)
      .with(SettingCategory.PRIVACY, () => <Privacy />)
      .with(SettingCategory.EXPERIMENTAL, () => <Experimental />)
      .exhaustive();

  const isGeneral = category === SettingCategory.GENERAL;

  return (
    <div className={styles.content}>
      {categoryConfig && <div className={styles['section-title']}>{categoryConfig.label}</div>}
      <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 0, labelFontSize: 14 } } }}>
        <Form colon={false} labelAlign="left" labelWrap wrapperCol={{ flex: 1 }}>
          {isGeneral ? renderSection() : <SettingsCard>{renderSection()}</SettingsCard>}
        </Form>
      </ConfigProvider>
    </div>
  );
};

export default SettingsContent;
