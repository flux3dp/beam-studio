import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';

import Select from '@core/app/widgets/AntdSelect';
import browser from '@core/implementations/browser';

import styles from './index.module.scss';

interface Props {
  id?: string;
  onChange: (val: number) => void;
  title: string;
  tooltip?: string;
  tooltipLink?: string;
  value: number;
}

const AddOnSelect = ({ id, onChange, title, tooltip, tooltipLink, value }: Props): React.ReactNode => {
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
        {tooltip && (
          <Tooltip title={tooltip}>
            <QuestionCircleOutlined
              className={styles.hint}
              onClick={tooltipLink ? () => browser.open(tooltipLink) : undefined}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default AddOnSelect;
