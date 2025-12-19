import React, { memo } from 'react';

import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import type { ImageDimensions } from '../../types';
import { useAiGenerateStore } from '../../useAiGenerateStore';
import { getSizePixels } from '../../utils/dimensions';

import styles from './MobileSizeSelector.module.scss';

interface Props {
  onClose: () => void;
}

const UnmemorizedMobileSizeSelector = ({ onClose }: Props) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const dimensions = useAiGenerateStore((s) => s.dimensions);

  const handleSelectSize = (size: ImageDimensions['size']) => {
    useAiGenerateStore.setState((s) => ({
      dimensions: { ...s.dimensions, size },
    }));
    onClose();
  };

  return (
    <div className={styles['size-selector']}>
      {/* Header */}
      <div className={styles['selector-header']}>
        <Button className={styles['back-button']} icon={<LeftOutlined />} onClick={onClose} type="text" />
        <span className={styles['selector-title']}>{t.dimensions.title}</span>
        <Button className={styles['close-button']} icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      {/* Size Grid */}
      <div className={styles['size-grid']}>
        {(['1K', '2K', '4K'] as const).map((size) => {
          const isSelected = dimensions.size === size;

          return (
            <div
              className={classNames(styles['size-card'], { [styles.selected]: isSelected })}
              key={size}
              onClick={() => handleSelectSize(size)}
            >
              <span className={styles['size-name']}>{size}</span>
              <span className={styles['size-pixels']}>{getSizePixels({ ...dimensions, size })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MobileSizeSelector = memo(UnmemorizedMobileSizeSelector);

export default MobileSizeSelector;
