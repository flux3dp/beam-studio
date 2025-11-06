import React, { memo, useState } from 'react';

import { CheckOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';

import { CATEGORIES, getCategoryForOption } from '../utils/categories';
import type { CategoryOption } from '../utils/categories';

import styles from './StyleSelectionPanel.module.scss';

interface StyleSelectionPanelProps {
  currentSelection: null | string; // Option ID
  onClose: () => void;
  onSelect: (optionId: string) => void; // Returns option ID
}

const UnmemorizedStyleSelectionPanel = ({ currentSelection, onClose, onSelect }: StyleSelectionPanelProps) => {
  // Auto-select category based on current selection
  const initialCategory = currentSelection
    ? getCategoryForOption(currentSelection)?.id || 'text-to-image'
    : 'text-to-image';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedOption, setSelectedOption] = useState<null | string>(currentSelection);

  const currentCategory = CATEGORIES.find((c) => c.id === selectedCategory);

  const handleOptionClick = (option: CategoryOption) => {
    setSelectedOption(option.id);
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onSelect(selectedOption);
      onClose();
    }
  };

  const handleClearAndClose = () => {
    onSelect('');
    onClose();
  };

  return (
    <Modal
      centered
      footer={
        <div className={styles.footer}>
          <Button onClick={handleClearAndClose}>Clear Style</Button>
          <div className={styles['footer-right']}>
            <Button onClick={onClose}>Cancel</Button>
            <Button disabled={!selectedOption} onClick={handleConfirm} type="primary">
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
        {/* LEFT SIDEBAR: Categories */}
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
              <p className={styles['category-desc']}>{category.description}</p>
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT: Options */}
        <div className={styles.content}>
          <h3 className={styles['content-title']}>{currentCategory?.displayName}</h3>
          <p className={styles['content-description']}>{currentCategory?.description}</p>

          <div className={styles['options-grid']}>
            {currentCategory?.options.map((option) => {
              const isSelected = selectedOption === option.id;

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
                    <div className={classNames(styles['preview-icon'], styles[option.id])}>
                      {option.displayName.charAt(0)}
                    </div>
                  </div>

                  <div className={styles['option-info']}>
                    <h4 className={styles['option-name']}>{option.displayName}</h4>
                    <p className={styles['option-description']}>{option.description}</p>
                    <span className={styles['mode-badge']}>
                      {option.mode === 'edit' ? 'Edit Mode' : 'Generate Mode'}
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
