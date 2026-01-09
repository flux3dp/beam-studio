import React from 'react';

import { InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import browser from '@core/implementations/browser';

import styles from './SettingFormItem.module.scss';

type Props = {
  children: React.ReactNode;
  id?: string;
  label: string;
  tooltip?: string;
  url?: string;
  warning?: string;
};

const SettingFormItem = ({ children, id, label, tooltip, url, warning }: Props): React.JSX.Element => {
  const renderInfo = (): React.ReactNode => {
    if (url) {
      return (
        <Tooltip title={url}>
          <InfoCircleOutlined className={styles.icon} onClick={() => browser.open(url)} />
        </Tooltip>
      );
    }

    if (tooltip) {
      return (
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined className={styles.icon} />
        </Tooltip>
      );
    }

    return null;
  };

  const renderWarning = (): React.ReactNode => {
    if (warning) {
      return <img alt="warning" className={styles.warning} src="core-img/warning.svg" title={warning} />;
    }

    return null;
  };

  return (
    <div className={styles['setting-row']} id={id}>
      <div className={styles['label-container']}>
        <span className={styles.label}>{label}</span>
        {renderInfo()}
      </div>
      <div className={styles['control-container']}>
        {children}
        {renderWarning()}
      </div>
    </div>
  );
};

export default SettingFormItem;
