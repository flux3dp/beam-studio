import React, { use } from 'react';

import { CapsuleTabs } from 'antd-mobile';

import { MyCloudContext } from '@core/app/contexts/MyCloudContext';
import Select from '@core/app/widgets/AntdSelect';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Head.module.scss';

const Head = (): React.JSX.Element => {
  const lang = useI18n().my_cloud.sort;
  const { setSortBy, sortBy } = use(MyCloudContext);
  const isMobile = useIsMobile();

  const sortOptions = [
    { label: lang.most_recent, value: 'recent' },
    { label: lang.oldest, value: 'old' },
    { label: lang.a_to_z, value: 'a2z' },
    { label: lang.z_to_a, value: 'z2a' },
  ];

  return isMobile ? (
    <CapsuleTabs activeKey={sortBy} className={styles.tabs} onChange={setSortBy}>
      {sortOptions.map(({ label, value }) => (
        <CapsuleTabs.Tab key={value} title={label} />
      ))}
    </CapsuleTabs>
  ) : (
    <div className={styles.head}>
      <Select
        bordered={false}
        className={styles.select}
        onChange={setSortBy}
        options={sortOptions}
        popupClassName={styles['select-dropdown']}
        popupMatchSelectWidth={false}
        value={sortBy}
      />
    </div>
  );
};

export default Head;
