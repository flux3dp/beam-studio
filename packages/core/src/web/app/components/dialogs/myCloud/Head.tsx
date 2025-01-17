import React, { useContext } from 'react';
import { CapsuleTabs } from 'antd-mobile';

import Select from 'app/widgets/AntdSelect';
import useI18n from 'helpers/useI18n';
import { MyCloudContext } from 'app/contexts/MyCloudContext';
import { useIsMobile } from 'helpers/system-helper';

import styles from './Head.module.scss';

const Head = (): JSX.Element => {
  const lang = useI18n().my_cloud.sort;
  const { sortBy, setSortBy } = useContext(MyCloudContext);
  const isMobile = useIsMobile();

  const sortOptions = [
    { value: 'recent', label: lang.most_recent },
    { value: 'old', label: lang.oldest },
    { value: 'a2z', label: lang.a_to_z },
    { value: 'z2a', label: lang.z_to_a },
  ];

  return isMobile ? (
    <CapsuleTabs className={styles.tabs} activeKey={sortBy} onChange={setSortBy}>
      {sortOptions.map(({ value, label }) => (
        <CapsuleTabs.Tab title={label} key={value} />
      ))}
    </CapsuleTabs>
  ) : (
    <div className={styles.head}>
      <Select
        className={styles.select}
        popupClassName={styles['select-dropdown']}
        value={sortBy}
        options={sortOptions}
        onChange={setSortBy}
        bordered={false}
        popupMatchSelectWidth={false}
      />
    </div>
  );
};

export default Head;
