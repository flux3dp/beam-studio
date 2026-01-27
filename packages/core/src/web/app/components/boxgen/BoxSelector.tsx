import React from 'react';

import { Menu } from 'antd';

import Select from '@core/app/widgets/AntdSelect';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './BoxSelector.module.scss';
import { BOX_TYPE_OPTIONS } from './boxTypeOptions';

// TODO: Currently, this is for UI display only
// Change canvas and controllers when adding new box type
const BoxSelector = (): null | React.JSX.Element => {
  const lang = useI18n().boxgen;
  const isMobile = useIsMobile();

  // Hide selector when there's only one option
  if (BOX_TYPE_OPTIONS.length <= 1) {
    return null;
  }

  const options = BOX_TYPE_OPTIONS.map((option) => ({
    key: option.key,
    label: lang[option.labelKey as keyof typeof lang],
    value: option.value,
  }));

  return isMobile ? (
    <div className={styles.container}>
      <Select className={styles.selector} defaultValue="basic" options={options} popupMatchSelectWidth={false} />
    </div>
  ) : (
    <Menu className={styles.selector} defaultSelectedKeys={['basic']} items={options} mode="horizontal" theme="light" />
  );
};

export default BoxSelector;
