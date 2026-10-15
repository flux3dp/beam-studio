import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { CloseOutlined } from '@ant-design/icons';

import styles from './SelectedItemSlot.module.scss';

interface SelectedItemSlotProps {
  children?: ReactNode;
  onClear?: () => void;
}

const SelectedItemSlot = ({ children, onClear }: SelectedItemSlotProps): ReactNode => (
  <div className={styles.container}>
    {onClear && (
      <button className={styles.clear} onClick={onClear} type="button">
        <CloseOutlined />
      </button>
    )}
    <div className={styles.icon}>{children}</div>
  </div>
);

SelectedItemSlot.displayName = 'SelectedItemSlot';

export default memo(SelectedItemSlot);
