import React, { useCallback, useMemo, useState } from 'react';

import { Button } from 'antd';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import AppSettings from '@core/app/app-settings';
import DraggableModal from '@core/app/widgets/DraggableModal';
import autoSaveHelper from '@core/helpers/auto-save-helper';
import i18n from '@core/helpers/i18n';
import { useIsMobile } from '@core/helpers/system-helper';
import storage from '@core/implementations/storage';
import type { AutoSaveConfig } from '@core/interfaces/AutoSaveConfig';
import type { ILang } from '@core/interfaces/ILang';

import { type SettingUnitInputProps, useSettingStore } from '../shared';

import { getCategoryConfigs } from './constants';
import SettingsSidebar from './desktop/SettingsSidebar';
import MobileSettingsPanel from './mobile/MobileSettingsModal';
import SettingsContent from './SettingsContent';
import styles from './SettingsModal.module.scss';
import { SettingCategory } from './types';

interface SettingsModalProps {
  initialCategory?: SettingCategory;
  onClose: () => void;
}

const SettingsModal = ({
  initialCategory = SettingCategory.GENERAL,
  onClose,
}: SettingsModalProps): React.JSX.Element => {
  const isMobile = useIsMobile();
  const [lang, setLang] = useState<ILang>(i18n.lang);
  const [selectedCategory, setSelectedCategory] = useState<SettingCategory>(initialCategory);
  const [editingAutosaveConfig, setEditingAutosaveConfig] = useState<AutoSaveConfig>(autoSaveHelper.getConfig());
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const previousActiveLang = useMemo(() => i18n.getActiveLang(), []);

  const { getConfig, resetChanges, updateToStorage } = useSettingStore();
  const defaultUnit = getConfig('default-units');

  const unitInputProps: Partial<SettingUnitInputProps> = useMemo(() => {
    const isInch = defaultUnit === 'inches';

    return {
      isInch,
      precision: isInch ? 4 : 2,
      step: isInch ? 2.54 : 1,
      unit: isInch ? 'in' : 'mm',
    };
  }, [defaultUnit]);

  const categoryConfigs = useMemo(
    () => getCategoryConfigs(lang, { isMobile }).filter((cat) => cat.visible !== false),
    [lang, isMobile],
  );
  const currentCategoryConfig = categoryConfigs.find((c) => c.key === selectedCategory);

  const changeActiveLang = useCallback((value: string): void => {
    i18n.setActiveLang(value);
    setLang(i18n.lang);
  }, []);

  const handleReset = async (): Promise<void> => {
    if (window.confirm(lang.settings.confirm_reset)) {
      storage.clearAllExceptIP();
      localStorage.clear();
      await autoSaveHelper.useDefaultConfig();
      onClose();
      window.location.hash = '#';
      window.location.reload();
    }
  };

  const handleApply = (): void => {
    updateToStorage();
    autoSaveHelper.setConfig(editingAutosaveConfig);
    onClose();
  };

  const handleCancel = (): void => {
    i18n.setActiveLang(previousActiveLang);
    resetChanges();
    onClose();
  };

  const hasWarnings = Object.keys(warnings).length > 0;

  const commonProps = useMemo(
    () => ({
      changeActiveLang,
      editingAutosaveConfig,
      setEditingAutosaveConfig,
      setWarnings,
      supportedLangs: AppSettings.i18n.supported_langs,
      unitInputProps,
      warnings,
    }),
    [changeActiveLang, editingAutosaveConfig, unitInputProps, warnings],
  );

  const footer = (
    <div className={styles.footer}>
      <div className={styles['left-buttons']}>
        <Button onClick={handleReset}>{lang.settings.reset_now}</Button>
      </div>
      <div className={styles['right-buttons']}>
        <Button onClick={handleCancel}>{lang.settings.cancel}</Button>
        <Button disabled={hasWarnings} onClick={handleApply} type="primary">
          {lang.settings.done}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSettingsPanel
        categoryConfigs={categoryConfigs}
        commonProps={commonProps}
        currentCategoryConfig={currentCategoryConfig}
        isAllValid={!hasWarnings}
        onApply={handleApply}
        onCancel={handleCancel}
        onReset={handleReset}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
    );
  }

  return (
    <DraggableModal
      footer={footer}
      maskClosable={false}
      onCancel={handleCancel}
      open
      scrollableContent
      title={lang.settings.caption}
      width={860}
      wrapClassName={styles['modal-wrap']}
    >
      <div className={styles.container}>
        <SettingsSidebar
          categories={categoryConfigs}
          onCategorySelect={setSelectedCategory}
          selectedCategory={selectedCategory}
        />
        <SettingsContent category={selectedCategory} categoryConfig={currentCategoryConfig} commonProps={commonProps} />
      </div>
    </DraggableModal>
  );
};

export const showSettingsModal = (initialCategory?: SettingCategory): void => {
  if (!isIdExist('settings-modal')) {
    addDialogComponent(
      'settings-modal',
      <SettingsModal initialCategory={initialCategory} onClose={() => popDialogById('settings-modal')} />,
    );
  }
};

export default SettingsModal;
