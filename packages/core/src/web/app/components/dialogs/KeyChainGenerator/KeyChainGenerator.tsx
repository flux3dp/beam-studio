import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { getCategoryById, getDefaultCategory, KEYCHAIN_CATEGORIES } from './categories';
import CategorySelector from './components/CategorySelector';
import OptionsPanel from './components/OptionsPanel';
import Preview from './components/Preview';
import { exportToCanvas } from './exportToCanvas';
import styles from './KeyChainGenerator.module.scss';
import useKeychainShapeStore from './useKeychainShapeStore';

interface KeyChainGeneratorProps {
  onClose: () => void;
}

const KeyChainGenerator = ({ onClose }: KeyChainGeneratorProps): React.JSX.Element => {
  const { generators: tGenerators, global: tGlobal, keychain_generator: t } = useI18n();
  const isMobile = useIsMobile();

  const defaultCategory = getDefaultCategory();
  const [isExporting, setIsExporting] = useState(false);

  const categoryId = useKeychainShapeStore((s) => s.state.categoryId);
  const isModified = useKeychainShapeStore((s) => s.isModified);
  const setCategoryState = useKeychainShapeStore((s) => s.setCategoryState);
  const reset = useKeychainShapeStore((s) => s.reset);

  useEffect(() => reset, [reset]);

  const currentCategory = useMemo(() => getCategoryById(categoryId) ?? defaultCategory, [categoryId, defaultCategory]);

  const handleCategoryChange = useCallback(
    (newCategoryId: string) => {
      if (newCategoryId === categoryId) return;

      const applyCategoryChange = () => {
        const newCategory = getCategoryById(newCategoryId) ?? defaultCategory;

        setCategoryState(newCategory);
      };

      if (isModified) {
        alertCaller.popUp({
          buttonType: alertConstants.YES_NO,
          message: t.switch_type_warning,
          onYes: applyCategoryChange,
          type: alertConstants.SHOW_POPUP_WARNING,
        });
      } else {
        applyCategoryChange();
      }
    },
    [categoryId, isModified, t.switch_type_warning, defaultCategory, setCategoryState],
  );

  const handleImport = useCallback(async () => {
    setIsExporting(true);

    try {
      await exportToCanvas();
      onClose();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      console.error('Failed to export keychain to canvas:', error);
      alertCaller.popUpError({ message: `${t.export_failed}\n\n${detail}` });
    } finally {
      setIsExporting(false);
    }
  }, [onClose, t]);

  return (
    <DraggableModal
      footer={
        <div className={styles.footer}>
          <Button disabled={isExporting} onClick={onClose}>
            {tGlobal.cancel}
          </Button>
          <Button loading={isExporting} onClick={handleImport} type="primary">
            {t.import_to_canvas}
          </Button>
        </div>
      }
      maskClosable={false}
      onCancel={onClose}
      open
      title={tGenerators.keychain_generator}
    >
      <div className={classNames(styles.container, { [styles.mobile]: isMobile })}>
        <CategorySelector
          categories={KEYCHAIN_CATEGORIES}
          currentCategoryId={categoryId}
          onCategoryChange={handleCategoryChange}
        />
        <Preview category={currentCategory} />
        <OptionsPanel category={currentCategory} />
      </div>
    </DraggableModal>
  );
};

export default KeyChainGenerator;
