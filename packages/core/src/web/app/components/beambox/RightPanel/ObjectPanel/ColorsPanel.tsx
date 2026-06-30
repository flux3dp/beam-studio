import React from 'react';

import { ConfigProvider } from 'antd';

import { selectTheme } from '@core/app/constants/antd-config';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { fixme } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import ColorPanel from '../ColorPanel';
import styles from '../InfillPanel.module.scss';
import MultiColorOptions from '../OptionsBlocks/MultiColorOptions';
fixme('split styles');

const ColorsPanel = (): React.ReactNode => {
  const isTablet = useIsTabletOrMobile();
  const tTag = useI18n().topbar.tag_names;
  const colorPanels = useSelectedElementStore((state) => state.objectPanelData!.colorPanels);
  const infillElems = useSelectedElementStore((state) => state.objectPanelData!.infillElems);
  const pathElems = useSelectedElementStore((state) => state.objectPanelData!.pathElems);
  const isTextPath = useSelectedElementStore((state) => state.objectPanelData!.isTextPath);
  const contents = colorPanels.map((type) => {
    // Note: for textpath objects, always displayed infill panels in old versions
    // and display color panels without stroke settings when changing object panel from static UI to collapsible UI and separating infill (and color) panels
    // TBC: display both color and stroke normally?
    switch (type) {
      case 'color':
        return isTextPath ? (
          isTablet ? (
            <ColorPanel elem={infillElems[0]} fillOnly key="text-color" label={tTag.text} />
          ) : (
            <div className={styles.section} key="text-color">
              <div className={styles['section-label']}>{tTag.text}</div>
              <ColorPanel elem={infillElems[0]} fillOnly />
            </div>
          )
        ) : (
          <ColorPanel elem={infillElems[0]} key="color" />
        );
      case 'colorPath':
        return isTablet ? (
          <ColorPanel elem={pathElems![0]} fillOnly key="path-color" label={tTag.path} />
        ) : (
          <div className={styles.section} key="path-color">
            <div className={styles['section-label']}>{tTag.path}</div>
            <ColorPanel elem={pathElems![0]} fillOnly />
          </div>
        );
      case 'multiColor':
        return <MultiColorOptions elem={infillElems[0]} key="multiColor" />;
    }
  });

  return isTablet ? (
    contents
  ) : (
    <ConfigProvider theme={selectTheme}>
      <div className={styles.panel}>{contents}</div>
    </ConfigProvider>
  );
};

export default ColorsPanel;
