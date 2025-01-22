import React from 'react';

import { Menu } from 'antd';

import Select from '@core/app/widgets/AntdSelect';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './BoxSelector.module.scss';

// TODO: Currently, this is for UI display only
// Change canvas and controllers when adding new box type
const BoxSelector = (): React.JSX.Element => {
  const lang = useI18n().boxgen;
  const isMobile = useIsMobile();
  const options = [
    {
      // for menu
      key: 'basic',
      label: lang.basic_box,
      // for select
      value: 'basic',
    },
  ];

  return isMobile ? (
    <div className={styles.container}>
      <Select className={styles.selector} defaultValue="basic" options={options} popupMatchSelectWidth={false} />
    </div>
  ) : (
    <Menu className={styles.selector} defaultSelectedKeys={['basic']} items={options} mode="horizontal" theme="light" />
  );
};

export default BoxSelector;
