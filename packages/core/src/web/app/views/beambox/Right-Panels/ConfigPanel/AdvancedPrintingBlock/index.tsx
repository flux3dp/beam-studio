import React from 'react';

import { Collapse, ConfigProvider } from 'antd';

import isDev from '@core/helpers/is-dev';

import AmDensityBlock from './AmDensityBlock';
import styles from './index.module.scss';
import RefreshInterval from './RefreshInterval';
import RefreshWidth from './RefreshWidth';
import RefreshZ from './RefreshZ';

export const AdvancedPrintingBlock = (): React.ReactNode => {
  if (!isDev()) return null;

  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            contentPadding: 0,
            headerPadding: '0 20px',
          },
        },
        token: {
          padding: 0,
          paddingSM: 0,
        },
      }}
    >
      <Collapse
        className={styles.container}
        defaultActiveKey={[]}
        ghost
        items={[
          {
            children: (
              <div className={styles.panel}>
                <AmDensityBlock />
                <RefreshInterval />
                <RefreshWidth />
                <RefreshZ />
              </div>
            ),
            key: '1',
            label: 'Printing Advanced',
          },
        ]}
      />
    </ConfigProvider>
  );
};

export default AdvancedPrintingBlock;
