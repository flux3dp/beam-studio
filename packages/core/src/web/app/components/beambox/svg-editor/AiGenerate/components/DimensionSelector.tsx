import React from 'react';

import { Button, Space } from 'antd';
import classNames from 'classnames';
import { createPortal } from 'react-dom';

import { useFloatingMenu } from '../hooks/useFloatingMenu';
import type { ImageDimensions, ImageSize } from '../types';
import { useAiGenerateStore } from '../useAiGenerateStore';
import { getSizePixels } from '../utils/dimensions';
import { ADDITIONAL_RATIOS, ALWAYS_DISPLAYED_RATIOS } from '../utils/ratioOptions';

import styles from './DimensionSelector.module.scss';

interface DimensionSelectorProps {
  dimensions: ImageDimensions;
}

/**
 * Component for selecting image dimensions (aspect ratio and size)
 * Includes a floating menu for additional aspect ratio options
 */
const DimensionSelector: React.FC<DimensionSelectorProps> = ({ dimensions }) => {
  // Floating menu for "More" aspect ratios
  const {
    buttonRef: moreButtonRef,
    closeMenu: closeMoreMenu,
    handleButtonEnter: handleMoreButtonEnter,
    handleButtonLeave: handleMoreButtonLeave,
    handleMenuEnter,
    handleMenuLeave,
    menuPosition,
    showMenu: showMoreMenu,
  } = useFloatingMenu();

  const isOptionSelected = ({ aspectRatio, orientation }: { aspectRatio: string; orientation: string }): boolean =>
    dimensions.aspectRatio === aspectRatio && dimensions.orientation === orientation;
  const isAdditionalRatioSelected = (): boolean => ADDITIONAL_RATIOS.some(isOptionSelected);

  return (
    <div className={styles.section}>
      <h3 className={styles['section-title']}>Image Dimensions</h3>
      <div className={styles['dimension-group']}>
        <Space size={8}>
          {ALWAYS_DISPLAYED_RATIOS.map((option) => (
            <Button
              className={classNames(styles['dimension-button'], { [styles.active]: isOptionSelected(option) })}
              key={option.aspectRatio}
              onClick={() =>
                useAiGenerateStore.setState((state) => ({
                  dimensions: {
                    ...state.dimensions,
                    aspectRatio: option.aspectRatio,
                    orientation: option.orientation,
                  },
                }))
              }
            >
              <div className={styles['ratio-icon']}>
                <div
                  className={classNames(styles['ratio-box'], styles[`ratio-${option.aspectRatio.replace(':', '-')}`])}
                />
              </div>
              <span>{option.displayLabel}</span>
            </Button>
          ))}
          <div
            className={styles['more-button-container']}
            onMouseEnter={handleMoreButtonEnter}
            onMouseLeave={handleMoreButtonLeave}
            ref={moreButtonRef}
          >
            <Button
              className={classNames(styles['dimension-button'], {
                [styles.active]: isAdditionalRatioSelected(),
              })}
            >
              <div className={styles['ratio-icon']}>
                <div className={classNames(styles['ratio-box'], styles['ratio-more'])} />
              </div>
              <span>More</span>
            </Button>
          </div>
          {showMoreMenu &&
            menuPosition &&
            createPortal(
              <div
                className={styles['floating-ratio-menu-portal']}
                onMouseEnter={handleMenuEnter}
                onMouseLeave={handleMenuLeave}
                style={{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }}
              >
                {ADDITIONAL_RATIOS.map((option) => (
                  <div
                    className={classNames(styles['menu-item'], { [styles.active]: isOptionSelected(option) })}
                    key={`${option.aspectRatio}-${option.orientation}`}
                    onClick={() => {
                      useAiGenerateStore.setState((state) => ({
                        dimensions: {
                          ...state.dimensions,
                          aspectRatio: option.aspectRatio,
                          orientation: option.orientation,
                        },
                      }));
                      closeMoreMenu();
                    }}
                  >
                    <div className={styles['menu-icon']}>
                      <div
                        className={classNames(
                          styles['menu-ratio-box'],
                          styles[`ratio-${option.orientation}-${option.aspectRatio.replace(':', '-')}`],
                        )}
                      />
                    </div>
                    <span>{option.displayLabel}</span>
                  </div>
                ))}
              </div>,
              document.body,
            )}
        </Space>
      </div>
      <div className={styles['dimension-group']}>
        <Space size={8}>
          {(['small', 'medium', 'large'] as ImageSize[]).map((size) => (
            <Button
              className={classNames(styles['size-button'], {
                [styles.active]: dimensions.size === size,
              })}
              key={size}
              onClick={() => useAiGenerateStore.setState((state) => ({ dimensions: { ...state.dimensions, size } }))}
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
