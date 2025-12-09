import React from 'react';

import { ClockCircleOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

const Header = ({ onClose, onHistory, onRefresh, showHistory }: any) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{t.title}</h2>
    <div className={styles.actions}>
      <Button
        className={classNames(styles['icon-button'], { [styles.active]: showHistory })}
        icon={<ClockCircleOutlined />}
        onClick={onHistory}
        shape="circle"
        type="text"
      />
      <Button
        className={styles['icon-button']}
        icon={<ReloadOutlined />}
        onClick={onRefresh}
        shape="circle"
        type="text"
      />
      <Button className={styles['icon-button']} icon={<CloseOutlined />} onClick={onClose} shape="circle" type="text" />
    </div>
  </div>
  );
};

export default Header;
