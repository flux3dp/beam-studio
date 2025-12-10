import React from 'react';

import { ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

interface HeaderProps {
  onClose: () => void;
  onHistory?: () => void;
  onRefresh?: () => void;
  showHistory?: boolean;
}

const Header = ({ onClose, onHistory, onRefresh, showHistory }: HeaderProps) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{t.header.title}</h2>
      <div className={styles.actions}>
        <Tooltip title={t.header.history_tooltip}>
          <Button
            className={classNames(styles['icon-button'], { [styles.active]: showHistory })}
            icon={<ClockCircleOutlined />}
            onClick={onHistory}
            shape="circle"
            type="text"
          />
        </Tooltip>
        <Tooltip title={t.header.reset_tooltip}>
          <Button
            className={styles['icon-button']}
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            shape="circle"
            type="text"
          />
        </Tooltip>
        <Button
          className={styles['icon-button']}
          icon={<CloseOutlined />}
          onClick={onClose}
          shape="circle"
          type="text"
        />
      </div>
    </div>
  );
};

export default Header;
