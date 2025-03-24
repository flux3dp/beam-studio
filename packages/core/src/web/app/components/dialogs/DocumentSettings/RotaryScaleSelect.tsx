import React from 'react';

import classNames from 'classnames';

import Select from '@core/app/widgets/AntdSelect';

import styles from './index.module.scss';

interface Props {
  id?: string;
  onChange: (val: number) => void;
  title: string;
  value: number;
}

const RotaryScaleSelect = ({ id, onChange, title, value }: Props): React.ReactNode => {
  return (
    <div className={classNames(styles.row, styles.full, styles.select)}>
      <div className={styles.title}>
        <label htmlFor={id}>{title}</label>
      </div>
      <div className={styles.control}>
        <Select
          className={styles.select}
          id={id}
          onChange={(val) => onChange(val)}
          options={[
            { label: 0.5, value: 0.5 },
            { label: 1.0, value: 1.0 },
            { label: 1.5, value: 1.5 },
            { label: 2.0, value: 2.0 },
          ]}
          value={value}
        />
      </div>
    </div>
  );
};

export default RotaryScaleSelect;
