import React, { memo } from 'react';

import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import type { AspectRatio } from '../../types';
import { useAiGenerateStore } from '../../useAiGenerateStore';
import { ALL_RATIOS } from '../../utils/ratioOptions';

import styles from './MobileRatioSelector.module.scss';

interface Props {
  onClose: () => void;
}

const UnmemorizedMobileRatioSelector = ({ onClose }: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const dimensions = useAiGenerateStore((s) => s.dimensions);

  const handleSelectRatio = (aspectRatio: AspectRatio) => {
    useAiGenerateStore.setState((s) => ({
      dimensions: { ...s.dimensions, aspectRatio },
    }));
    onClose();
  };

  return (
    <div className={styles['ratio-selector']}>
      {/* Header */}
      <div className={styles['selector-header']}>
        <Button className={styles['back-button']} icon={<LeftOutlined />} onClick={onClose} type="text" />
        <span className={styles['selector-title']}>{t.dimensions.title}</span>
        <Button className={styles['close-button']} icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      {/* Aspect Ratio Grid */}
      <div className={styles['ratio-grid']}>
        {ALL_RATIOS.map((option) => {
          const isSelected = dimensions.aspectRatio === option.aspectRatio;

          return (
            <div
              className={classNames(styles['ratio-card'], { [styles.selected]: isSelected })}
              key={option.aspectRatio}
              onClick={() => handleSelectRatio(option.aspectRatio)}
            >
              <div className={styles['ratio-icon-wrapper']}>
                <div
                  className={classNames(styles['ratio-box'], styles[`ratio-${option.aspectRatio.replace(':', '-')}`])}
                />
              </div>
              <span className={styles['ratio-label']}>{option.displayLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MobileRatioSelector = memo(UnmemorizedMobileRatioSelector);

export default MobileRatioSelector;
