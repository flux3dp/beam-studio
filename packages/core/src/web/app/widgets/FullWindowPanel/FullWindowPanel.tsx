import React, { createContext, useMemo } from 'react';

import classNames from 'classnames';

import layoutConstants from '@core/app/constants/layout-constants';
import FloatingPanel from '@core/app/widgets/FloatingPanel';
import { getOS } from '@core/helpers/getOS';
import isWeb from '@core/helpers/is-web';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './FullWindowPanel.module.scss';

interface Context {
  isDesktop: boolean;
  isMobile: boolean;
  isWindows: boolean;
}

export const FullWindowPanelContext = createContext<Context>({
  isDesktop: true,
  isMobile: false,
  isWindows: false,
});

interface Props {
  mobileTitle: React.JSX.Element | string;
  onClose?: () => void;
  renderContents?: () => React.ReactNode;
  renderMobileContents?: () => React.ReactNode;
  renderMobileFixedContent?: () => React.ReactNode;
}

const FullWindowPanel = ({
  mobileTitle,
  onClose,
  renderContents,
  renderMobileContents,
  renderMobileFixedContent,
}: Props): React.JSX.Element => {
  const isMobile = useIsMobile();
  const isWindows = useMemo(() => getOS() === 'Windows', []);
  const web = useMemo(() => isWeb(), []);

  if (isMobile) {
    return (
      <FullWindowPanelContext.Provider value={{ isDesktop: !web, isMobile, isWindows }}>
        <FloatingPanel
          anchors={[0, window.innerHeight - layoutConstants.titlebarHeight]}
          className={classNames(styles.container, {
            [styles.desktop]: !web,
            [styles.windows]: isWindows,
          })}
          fixedContent={renderMobileFixedContent?.()}
          onClose={onClose}
          title={mobileTitle}
        >
          {renderMobileContents?.()}
        </FloatingPanel>
      </FullWindowPanelContext.Provider>
    );
  }

  return (
    <FullWindowPanelContext.Provider value={{ isDesktop: !web, isMobile, isWindows }}>
      <div
        className={classNames(styles.container, {
          [styles.desktop]: !web,
          [styles.windows]: isWindows,
        })}
      >
        {renderContents?.()}
      </div>
    </FullWindowPanelContext.Provider>
  );
};

export default FullWindowPanel;
