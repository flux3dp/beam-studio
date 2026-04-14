import { memo, type ReactNode } from 'react';

import { Switch } from 'antd';

import styles from './Base.module.scss';

interface Props {
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}

const SwitchControl = ({ label, onChange, value }: Props): ReactNode => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.label}>{label}</div>
        <Switch checked={value} onChange={onChange} size="small" />
      </div>
    </div>
  );
};

SwitchControl.displayName = 'SwitchControl';

export default memo(SwitchControl);
