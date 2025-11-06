import React, { memo, useState } from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';

import { CATEGORIES, getCategoryForOption } from '../utils/categories';
import type { Style } from '../utils/categories';
import type { StylePresetKey } from '../utils/stylePresets';

import styles from './StyleSelectionPanel.module.scss';

interface StyleSelectionPanelProps {
  currentStyle: StylePresetKey; // Option ID
  onClose: () => void;
  onSelect: (style: StylePresetKey) => void; // Returns option ID
}

const UnmemorizedStyleSelectionPanel = ({ currentStyle, onClose, onSelect }: StyleSelectionPanelProps) => {
  // Auto-select category based on current selection
  const initialCategory = currentStyle ? getCategoryForOption(currentStyle)?.id || 'text-to-image' : 'text-to-image';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedStyle, setSelectedStyle] = useState<null | StylePresetKey>(currentStyle);
  const currentCategory = CATEGORIES.find(({ id }) => id === selectedCategory)!;

  const handleOptionClick = (option: Style) => {
    setSelectedStyle(option.id);
  };

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
        <div className={styles.sidebar}>
          {CATEGORIES.map((category) => (
            <div
              className={classNames(styles['category-item'], {
                [styles.active]: selectedCategory === category.id,
              })}
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              <h4 className={styles['category-name']}>{category.displayName}</h4>
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT: Options */}
        <div className={styles.content}>
          <h3 className={styles['content-title']}>{currentCategory?.displayName}</h3>
          <div className={styles['options-grid']}>
            {currentCategory.styles.map((option) => {
              const isSelected = selectedStyle === option.id;

              return (
                <div
                  className={classNames(styles['option-card'], {
                    [styles.selected]: isSelected,
                  })}
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                >
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
                    <span className={styles['mode-badge']}>
                      {option.mode === 'edit' ? 'Edit Mode' : 'Text to Image Mode'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const StyleSelectionPanel = memo(UnmemorizedStyleSelectionPanel);

export default StyleSelectionPanel;
