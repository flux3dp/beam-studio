import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import Divider from '@core/app/components/common/Divider';

import styles from './Header.module.scss';

interface Props {
  closable?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
}

const Header = ({ closable = true, onClose, title }: Props): React.ReactNode => {
  if (!title && !closable) return null;

  return (
    <>
      <div className={styles.header}>
        <span style={{ flex: 1, fontWeight: 600 }}>{title}</span>
        {closable && <Button icon={<CloseOutlined />} onClick={onClose} size="small" type="text" />}
      </div>
      <Divider marginBottom={16} marginTop={12} />
    </>
  );
};

export default Header;
