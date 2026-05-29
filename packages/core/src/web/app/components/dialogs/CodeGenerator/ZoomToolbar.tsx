import React from 'react';

import { DownOutlined, ExpandOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Dropdown } from 'antd';

import styles from './ZoomToolbar.module.scss';

const PRESETS = [25, 50, 75, 100, 150, 200, 400];

interface Props {
  onFit: () => void;
  onSetZoom: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}

const ZoomToolbar = ({ onFit, onSetZoom, onZoomIn, onZoomOut, zoom }: Props): React.JSX.Element => {
  const items = PRESETS.map((value) => ({
    key: String(value),
    label: `${value}%`,
    onClick: () => onSetZoom(value),
  }));

  return (
    <div className={styles.toolbar} onClick={(e) => e.stopPropagation()}>
      <Button className={styles.button} icon={<ExpandOutlined />} onClick={onFit} type="text" />
      <Dropdown menu={{ items }} placement="top" trigger={['click']}>
        <Button className={styles.button} icon={<DownOutlined />} type="text" />
      </Dropdown>
      <Divider className={styles.divider} type="vertical" />
      <Button className={styles.button} icon={<MinusOutlined />} onClick={onZoomOut} type="text" />
      <span className={styles.value}>{zoom}%</span>
      <Button className={styles.button} icon={<PlusOutlined />} onClick={onZoomIn} type="text" />
    </div>
  );
};

export default ZoomToolbar;
