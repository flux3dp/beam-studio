import React, { memo } from 'react';

import { ConfigProvider } from 'antd';

import { iconButtonTheme } from '@core/app/constants/antd-config';

import AlignDistSection from './AlignDistSection';
import BooleanSection from './BooleanSection';
import GroupSection from './GroupSection';
import styles from './ToolPanel.module.scss';

const ToolPanel = () => {
  return (
    <ConfigProvider theme={iconButtonTheme}>
      <div>
        <AlignDistSection />
        <div className={styles.row}>
          <GroupSection />
          <BooleanSection />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default memo(ToolPanel);
