import React, { useMemo, useState } from 'react';

import { Button } from 'antd';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import AppSettings from '@core/app/app-settings';
import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import autoSaveHelper from '@core/helpers/auto-save-helper';
import i18n from '@core/helpers/i18n';
import storage from '@core/implementations/storage';
import type { AutoSaveConfig } from '@core/interfaces/AutoSaveConfig';
import type { ILang } from '@core/interfaces/ILang';

import { getCategoryConfigs } from './constants';
import SettingsContent from './SettingsContent';
import styles from './SettingsModal.module.scss';
import SettingsSidebar from './SettingsSidebar';
import { SettingCategory } from './types';

interface SettingsModalProps {
  initialCategory?: SettingCategory;
  onClose: () => void;
}

const SettingsModal = ({
  initialCategory = SettingCategory.GENERAL,
  onClose,
}: SettingsModalProps): React.JSX.Element => {
  const [lang, setLang] = useState<ILang>(i18n.lang);
  const [selectedCategory, setSelectedCategory] = useState<SettingCategory>(initialCategory);
  const [editingAutosaveConfig, setEditingAutosaveConfig] = useState<AutoSaveConfig>(autoSaveHelper.getConfig());
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const previousActiveLang = useMemo(() => i18n.getActiveLang(), []);

  const { getConfig, resetChanges, updateToStorage } = useSettingStore();
  const defaultUnit = getConfig('default-units');

  const commonUnitInputProps: Partial<SettingUnitInputProps> = useMemo(() => {
    const isInch = defaultUnit === 'inches';

    return { isInch, precision: isInch ? 4 : 2, step: isInch ? 2.54 : 1, unit: isInch ? 'in' : 'mm' };
  }, [defaultUnit]);

  const categoryConfigs = useMemo(() => getCategoryConfigs(lang), [lang]);
  const currentCategoryConfig = categoryConfigs.find((c) => c.key === selectedCategory);

  const changeActiveLang = (value: string): void => {
    i18n.setActiveLang(value);
    setLang(i18n.lang);
  };

  const handleReset = (): void => {
    if (window.confirm(lang.settings.confirm_reset)) {
      storage.clearAllExceptIP();
      localStorage.clear();
      autoSaveHelper.useDefaultConfig();
      onClose();
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

  const isAllValid = Object.keys(warnings).length === 0;

  const footer = (
    <div className={styles.footer}>
      <div className={styles['left-buttons']}>
        <Button onClick={handleReset}>{lang.settings.reset_now}</Button>
      </div>
      <div className={styles['right-buttons']}>
        <Button onClick={handleCancel}>{lang.settings.cancel}</Button>
        <Button disabled={!isAllValid} onClick={handleApply} type="primary">
          {lang.settings.done}
        </Button>
      </div>
    </div>
  );

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
        <SettingsContent
          category={selectedCategory}
          categoryConfig={currentCategoryConfig}
          commonProps={{
            changeActiveLang,
            editingAutosaveConfig,
            setEditingAutosaveConfig,
            setWarnings,
            supportedLangs: AppSettings.i18n.supported_langs,
            unitInputProps: commonUnitInputProps,
            warnings,
          }}
        />
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
