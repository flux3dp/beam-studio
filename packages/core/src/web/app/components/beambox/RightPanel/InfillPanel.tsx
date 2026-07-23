import React, { memo } from 'react';

import { ConfigProvider } from 'antd';

import { selectTheme } from '@core/app/constants/antd-config';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';

import styles from './InfillPanel.module.scss';
import InFillBlock from './OptionsBlocks/InFillBlock';

const InfillPanel = (): React.ReactNode => {
  const isTablet = useIsTabletOrMobile();
  const infillPanels = useSelectedElementStore((state) => state.objectPanelData!.infillPanels);
  const contents = infillPanels.map((type) => <InFillBlock key={type} type={type} />);

  return isTablet ? (
    contents
  ) : (
    <ConfigProvider theme={selectTheme}>
      <div className={styles.panel}>{contents}</div>
    </ConfigProvider>
  );
};

export default memo(InfillPanel);
