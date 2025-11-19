import React from 'react';

import { Button, Space } from 'antd';
import classNames from 'classnames';
import { createPortal } from 'react-dom';

import { useFloatingMenu } from '../hooks/useFloatingMenu';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { getSizePixels } from '../utils/dimensions';
import { ADDITIONAL_RATIOS, ALWAYS_DISPLAYED_RATIOS } from '../utils/ratioOptions';

import styles from './DimensionSelector.module.scss';

const RatioButton = ({
  aspectRatio,
  isActive,
  isMenu = false,
  isMoreTrigger = false,
  label,
  onClick,
  orientation,
}: any) => {
  const ratio = orientation === 'landscape' ? aspectRatio : aspectRatio.split(':').reverse().join(':');
  const iconClass = isMoreTrigger ? styles['ratio-more'] : styles[`ratio-${ratio.replace(':', '-')}`];
  const Container = isMenu ? 'div' : Button;
  const wrapperClass = isMenu ? styles['menu-item'] : styles['dimension-button'];
  const iconWrapperClass = isMenu ? styles['menu-icon'] : styles['ratio-icon'];

  return (
    <Container className={classNames(wrapperClass, { [styles.active]: isActive })} onClick={onClick}>
      <div className={iconWrapperClass}>
        <div className={classNames(styles['ratio-box'], iconClass)} />
      </div>
      <span>{label}</span>
    </Container>
  );
};

const DimensionSelector: React.FC<{ dimensions: any }> = ({ dimensions }) => {
  const {
    buttonRef,
    closeMenu,
    handleButtonEnter,
    handleButtonLeave,
    handleMenuEnter,
    handleMenuLeave,
    menuPosition,
    showMenu,
  } = useFloatingMenu();

  const updateDim = (r: any) =>
    useAiGenerateStore.setState((s) => ({
      dimensions: { ...s.dimensions, aspectRatio: r.aspectRatio, orientation: r.orientation },
    }));

  const isSelected = (r: any) => dimensions.aspectRatio === r.aspectRatio && dimensions.orientation === r.orientation;
  const isAnyExtraSelected = ADDITIONAL_RATIOS.some(isSelected);

  return (
    <div className={styles.section}>
      <h3 className={styles['section-title']}>Image Dimensions</h3>

      {/* Aspect Ratios */}
      <div className={styles['dimension-group']}>
        <Space size={8}>
          {ALWAYS_DISPLAYED_RATIOS.map((option) => (
            <RatioButton
              aspectRatio={option.aspectRatio}
              isActive={isSelected(option)}
              key={option.aspectRatio}
              label={option.displayLabel}
              onClick={() => updateDim(option)}
              orientation={option.orientation}
            />
          ))}

          {/* "More" Dropdown Trigger */}
          <div
            className={styles['more-button-container']}
            onMouseEnter={handleButtonEnter}
            onMouseLeave={handleButtonLeave}
            ref={buttonRef}
          >
            <RatioButton aspectRatio="" isActive={isAnyExtraSelected} isMoreTrigger label="More" />
          </div>

          {/* "More" Dropdown Menu */}
          {showMenu &&
            menuPosition &&
            createPortal(
              <div
                className={styles['floating-ratio-menu-portal']}
                onMouseEnter={handleMenuEnter}
                onMouseLeave={handleMenuLeave}
                style={{ left: menuPosition.left, top: menuPosition.top }}
              >
                {ADDITIONAL_RATIOS.map((option) => (
                  <RatioButton
                    aspectRatio={option.aspectRatio}
                    isActive={isSelected(option)}
                    isMenu
                    key={option.aspectRatio}
                    label={option.displayLabel}
                    onClick={() => {
                      updateDim(option);
                      closeMenu();
                    }}
                    orientation={option.orientation}
                  />
                ))}
              </div>,
              document.body,
            )}
        </Space>
      </div>

      {/* Size Selection */}
      <div className={styles['dimension-group']}>
        <Space size={8}>
          {['small', 'medium', 'large'].map((size: any) => (
            <Button
              className={classNames(styles['size-button'], { [styles.active]: dimensions.size === size })}
              key={size}
              onClick={() => useAiGenerateStore.setState((s) => ({ dimensions: { ...s.dimensions, size } }))}
            >
              <span className={styles['size-name']}>{size.charAt(0).toUpperCase() + size.slice(1)}</span>
              <span className={styles['size-pixels']}>{getSizePixels({ ...dimensions, size })}</span>
            </Button>
          ))}
        </Space>
      </div>
    </div>
  );
};

export default DimensionSelector;
