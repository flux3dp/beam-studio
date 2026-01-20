import React, { memo, useMemo } from 'react';

import { ReloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

import SettingsContent from '../SettingsContent';
import { SettingCategory } from '../types';
import type { CommonSettingProps, SettingCategoryConfig } from '../types';

import MobileCategoryTabs from './MobileCategoryTabs';
import styles from './MobileSettingsModal.module.scss';

interface Props {
  categoryConfigs: SettingCategoryConfig[];
  commonProps: CommonSettingProps;
  currentCategoryConfig: SettingCategoryConfig | undefined;
  isAllValid: boolean;
  onApply: () => void;
  onCancel: () => void;
  onReset: () => Promise<void>;
  selectedCategory: SettingCategory;
  setSelectedCategory: (category: SettingCategory) => void;
}

const MobileSettingsPanel = memo(
  ({
    categoryConfigs,
    commonProps,
    currentCategoryConfig,
    isAllValid,
    onApply,
    onCancel,
    onReset,
    selectedCategory,
    setSelectedCategory,
  }: Props): React.JSX.Element => {
    const lang = useI18n();

    const mobileCategories = useMemo<SettingCategoryConfig[]>(
      () => [
        ...categoryConfigs,
        { icon: <ReloadOutlined />, key: SettingCategory.RESET, label: lang.global.editing.reset },
      ],
      [categoryConfigs, lang.global.editing.reset],
    );
    const mobileCommonProps = useMemo(() => ({ ...commonProps, onReset }), [commonProps, onReset]);

    return (
      <DraggableModal
        footer={
          <div className={styles['mobile-modal-footer']}>
            <Button onClick={onCancel}>{lang.settings.cancel}</Button>
            <Button disabled={!isAllValid} onClick={onApply} type="primary">
              {lang.settings.done}
            </Button>
          </div>
        }
        maskClosable={false}
        onCancel={onCancel}
        open
        scrollableContent
        title={<div className={styles['mobile-modal-title']}>{lang.settings.caption}</div>}
        width="calc(100vw - 32px)"
        wrapClassName={styles['mobile-modal-wrap']}
      >
        <div className={styles['mobile-container']}>
          <MobileCategoryTabs
            categories={mobileCategories}
            onCategorySelect={setSelectedCategory}
            selectedCategory={selectedCategory}
          />
          <div className={styles['mobile-settings-content']}>
            <SettingsContent
              category={selectedCategory}
              categoryConfig={currentCategoryConfig}
              commonProps={mobileCommonProps}
              isMobile
            />
          </div>
        </div>
      </DraggableModal>
    );
  },
);

export default MobileSettingsPanel;
