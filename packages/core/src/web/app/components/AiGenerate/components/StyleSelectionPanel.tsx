import React, { memo, useState } from 'react';

import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Modal } from 'antd';
import classNames from 'classnames';

import type { Style } from '@core/helpers/api/ai-image-config';
import useI18n from '@core/helpers/useI18n';

import { useStyleSelector } from '../hooks/useStyleSelector';
import { useAiGenerateStore } from '../useAiGenerateStore';

import styles from './StyleSelectionPanel.module.scss';

interface StyleSelectionPanelProps {
  onClose: () => void;
  onSelect: (style: string) => void;
}

const OptionCard = ({ isSelected, onClick, option }: { isSelected: boolean; onClick: () => void; option: Style }) => (
  <div className={classNames(styles['option-card'], { [styles.selected]: isSelected })} onClick={onClick}>
    <div className={styles['option-preview']}>
      <img alt={option.displayName} className={styles['preview-image']} src={option.previewImage} />
    </div>
    <div className={styles['option-overlay']}>
      <h4 className={styles['option-name']}>{option.displayName}</h4>
    </div>
  </div>
);

const StyleSelectionPanel = memo(({ onClose, onSelect }: StyleSelectionPanelProps) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const { styleId } = useAiGenerateStore();
  const { categoryStyles, displayCategories, selectedCategory, setSelectedCategory } = useStyleSelector({ styleId });
  const [selectedStyle, setSelectedStyle] = useState(styleId);

  const handleConfirm = () => {
    if (selectedStyle) {
      onSelect(selectedStyle);
      onClose();
    }
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, borderRadiusLG: 6 } }}>
      <Modal
        centered
        className={styles['style-modal']}
        footer={
          <div className={styles.footer}>
            <div>
              <Button
                className={classNames(styles['custom-creation-btn'], {
                  [styles.active]: selectedStyle === 'customize',
                })}
                onClick={() => {
                  onSelect('customize');
                  onClose();
                }}
                size={'large'}
              >
                <UserOutlined />
                <span>{t.style.custom_creation}</span>
                <PlusOutlined />
              </Button>
            </div>
            <div className={styles['footer-right']}>
              <Button onClick={onClose} size="large">
                {lang.global.cancel}
              </Button>
              <Button disabled={!selectedStyle} onClick={handleConfirm} size="large" type="primary">
                {t.style.apply}
              </Button>
            </div>
          </div>
        }
        onCancel={onClose}
        open
        title={t.style.select}
        width={1000} // Wider modal for the grid
      >
        <div className={styles.container}>
          <div className={styles.sidebar}>
            <div className={styles['categories-list']}>
              {displayCategories.map((category) => (
                <div
                  className={classNames(styles['category-item'], {
                    [styles.active]: selectedCategory === category.id,
                  })}
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <img alt={category.displayName} className={styles['category-icon']} src={category.previewImage} />
                  <span className={styles['category-name']}>{category.displayName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.content}>
            <div className={styles['options-grid']}>
              {categoryStyles.map((option) => (
                <OptionCard
                  isSelected={selectedStyle === option.id}
                  key={option.id}
                  onClick={() => setSelectedStyle(option.id)}
                  option={option}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
});

export default StyleSelectionPanel;
