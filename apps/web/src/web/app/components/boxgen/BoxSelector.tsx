import React from 'react';
import { Menu } from 'antd';

import Select from 'app/widgets/AntdSelect';
import useI18n from 'helpers/useI18n';
import { useIsMobile } from 'helpers/system-helper';

import styles from './BoxSelector.module.scss';

// TODO: Currently, this is for UI display only
// Change canvas and controllers when adding new box type
const BoxSelector = (): JSX.Element => {
  const lang = useI18n().boxgen;
  const isMobile = useIsMobile();
  const options = [
    {
      // for menu
      key: 'basic',
      // for select
      value: 'basic',
      label: lang.basic_box,
    },
  ];
  return isMobile ? (
    <div className={styles.container}>
      <Select
        className={styles.selector}
        defaultValue="basic"
        options={options}
        popupMatchSelectWidth={false}
      />
    </div>
  ) : (
    <Menu
      className={styles.selector}
      defaultSelectedKeys={['basic']}
      items={options}
      mode="horizontal"
      theme="light"
    />
  );
};

export default BoxSelector;
