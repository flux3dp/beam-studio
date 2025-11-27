import React, { memo, useState } from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';

import { useAiConfigQuery } from '../hooks/useAiConfigQuery';
import { getCategoryForOption, getStylesForCategory } from '../utils/categories';
import type { StyleLike } from '../utils/categories';

import styles from './StyleSelectionPanel.module.scss';

interface StyleSelectionPanelProps {
  currentStyle: string;
  onClose: () => void;
  onSelect: (style: string) => void;
}

const OptionCard = ({
  isSelected,
  onClick,
  option,
}: {
  isSelected: boolean;
  onClick: () => void;
  option: StyleLike;
}) => (
  <div className={classNames(styles['option-card'], { [styles.selected]: isSelected })} onClick={onClick}>
    {isSelected && (
      <div className={styles['check-badge']}>
        <CheckOutlined />
      </div>
    )}
    <div className={styles['option-preview']}>
      <img alt={option.displayName} className={styles['preview-image']} src={option.previewImage} />
    </div>
    <div className={styles['option-info']}>
      <h4 className={styles['option-name']}>{option.displayName}</h4>
    </div>
  </div>
);

const UnmemorizedStyleSelectionPanel = ({ currentStyle, onClose, onSelect }: StyleSelectionPanelProps) => {
  const { data: aiConfig } = useAiConfigQuery();
  const displayCategories = aiConfig?.categories ?? [];
  const displayStyles = aiConfig?.styles ?? [];

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const primaryCategory = getCategoryForOption(currentStyle, displayStyles, displayCategories);

    return primaryCategory?.id || displayCategories[0]?.id || 'customize';
  });
  const [selectedStyle, setSelectedStyle] = useState(currentStyle);

  const currentCategory = displayCategories.find((c) => c.id === selectedCategory);
  const currentCategoryStyles = getStylesForCategory(selectedCategory, displayStyles, displayCategories);

  const handleConfirm = () => {
    if (selectedStyle) {
      onSelect(selectedStyle);
      onClose();
    }
  };

  return (
    <Modal
      centered
      footer={
        <div className={styles.footer}>
          <div className={styles['footer-right']}>
            <Button onClick={onClose}>Cancel</Button>
            <Button disabled={!selectedStyle} onClick={handleConfirm} type="primary">
              Apply Style
            </Button>
          </div>
        </div>
      }
      onCancel={onClose}
      open
      title="Select Creation Style"
      width={900}
    >
      <div className={styles.container}>
        {/* Sidebar: Categories */}
        <div className={styles.sidebar}>
          {displayCategories.map((category) => (
            <div
              className={classNames(styles['category-item'], {
                [styles.active]: selectedCategory === category.id,
              })}
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              <img
                alt={category.displayName}
                className={styles['category-preview-image']}
                src={category.previewImage}
              />
              <h4 className={styles['category-name']}>{category.displayName}</h4>
            </div>
          ))}
        </div>

        {/* Content: Style Options */}
        <div className={styles.content}>
          <h3 className={styles['content-title']}>{currentCategory?.displayName}</h3>
          <div className={styles['options-grid']}>
            {currentCategoryStyles.map((option) => (
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
  );
};

const StyleSelectionPanel = memo(UnmemorizedStyleSelectionPanel);

export default StyleSelectionPanel;
