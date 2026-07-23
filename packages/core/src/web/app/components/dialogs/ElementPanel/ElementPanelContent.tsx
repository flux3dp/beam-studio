import type { ReactNode } from 'react';
import React, { use } from 'react';

import classNames from 'classnames';

import { ContentType } from '@core/app/constants/element-panel-constants';
import layoutConstants from '@core/app/constants/layout-constants';
import { ElementPanelContext } from '@core/app/contexts/ElementPanelContext';
import { useIsMobile } from '@core/app/stores/layoutStore';
import Drawer from '@core/app/widgets/Drawer';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import useI18n from '@core/helpers/useI18n';

import BackButton from './BackButton';
import styles from './ElementPanel.module.scss';
import MainContent from './MainContent';
import MainTypeSelector from './MainTypeSelector';
import SearchBar from './SearchBar';

interface ElementPanelContentProps {
  drawerPlacement?: React.ComponentProps<typeof Drawer>['placement'];
  getDrawerContainer?: () => HTMLElement;
}

const ElementPanelContent = ({ drawerPlacement, getDrawerContainer }: ElementPanelContentProps): ReactNode => {
  const { allTypes, contentType, onClose, open } = use(ElementPanelContext);
  const lang = useI18n().beambox.elements_panel;
  const isMobile = useIsMobile();
  const anchors = [0, window.innerHeight - layoutConstants.menubarHeight];

  return isMobile ? (
    <FloatingPanel
      anchors={anchors}
      className={styles.panel}
      fixedContent={
        <div
          className={classNames(styles.header, {
            [styles['hide-search']]: contentType !== ContentType.Search,
            [styles['hide-select']]: contentType !== ContentType.MainType,
          })}
        >
          <BackButton />
          <SearchBar />
          <MainTypeSelector />
        </div>
      }
      forceClose={!open}
      onClose={onClose}
      title={lang.title}
    >
      <MainContent types={allTypes} />
    </FloatingPanel>
  ) : (
    <Drawer
      classNames={{ body: styles['drawer-body'], header: styles['drawer-header'] }}
      closeIcon={null}
      destroyOnClose
      enableResizable={false}
      getContainer={getDrawerContainer}
      isOpen={open}
      onClose={onClose}
      placement={drawerPlacement}
      rootClassName={styles.drawer}
      title={
        <div className={classNames(styles.header, { [styles['hide-search']]: contentType !== ContentType.Search })}>
          <BackButton />
          <MainTypeSelector />
          <SearchBar />
        </div>
      }
    >
      <MainContent types={allTypes} />
    </Drawer>
  );
};

export default ElementPanelContent;
