import React, { useEffect, useRef } from 'react';

import { ConfigProvider, Form } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import AutoSave from '../AutoSave';
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
import Reset from '../Reset';

import styles from './SettingsModal.module.scss';
import type { CommonSettingProps, SettingCategoryConfig } from './types';
import { SettingCategory } from './types';

interface SettingsContentProps {
  category: SettingCategory;
  categoryConfig: SettingCategoryConfig | undefined;
  commonProps: CommonSettingProps;
  isMobile?: boolean;
}

const SettingsContent = ({
  category,
  categoryConfig,
  commonProps,
  isMobile = false,
}: SettingsContentProps): React.JSX.Element => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [category]);

  const {
    changeActiveLang,
    editingAutosaveConfig,
    onReset,
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
      .with(SettingCategory.EDITOR, () => (
        <Editor subSectionTitleClass={styles['sub-section-title']} unitInputProps={unitInputProps} wrapped />
      ))
      .with(SettingCategory.ENGRAVING, () => <Engraving />)
      .with(SettingCategory.PATH, () => <Path unitInputProps={unitInputProps} />)
      .with(SettingCategory.MODULE, () => (
        <Module subSectionTitleClass={styles['sub-section-title']} unitInputProps={unitInputProps} wrapped />
      ))
      .with(SettingCategory.PRIVACY, () => <Privacy />)
      .with(SettingCategory.EXPERIMENTAL, () => <Experimental />)
      .with(SettingCategory.RESET, () => (onReset ? <Reset onReset={onReset} /> : null))
      .exhaustive();

  const skipOuterCard = [
    SettingCategory.EDITOR,
    SettingCategory.GENERAL,
    SettingCategory.MODULE,
    SettingCategory.RESET,
  ].includes(category);

  const formTheme = {
    components: { Form: { itemMarginBottom: isMobile ? 16 : 0, labelFontSize: 14 } },
  };

  return (
    <div className={classNames(styles.content, { [styles.mobile]: isMobile })} ref={contentRef}>
      {categoryConfig && <div className={styles['section-title']}>{categoryConfig.label}</div>}
      <ConfigProvider theme={formTheme}>
        <Form
          colon={false}
          labelAlign="left"
          labelWrap
          layout={isMobile ? 'vertical' : 'horizontal'}
          wrapperCol={isMobile ? undefined : { flex: 1 }}
        >
          {skipOuterCard ? renderSection() : <SettingsCard>{renderSection()}</SettingsCard>}
        </Form>
      </ConfigProvider>
    </div>
  );
};

export default SettingsContent;
