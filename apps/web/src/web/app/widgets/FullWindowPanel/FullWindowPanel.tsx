import classNames from 'classnames';
import React, { createContext, useMemo } from 'react';

import FloatingPanel from 'app/widgets/FloatingPanel';
import isWeb from 'helpers/is-web';
import layoutConstants from 'app/constants/layout-constants';
import { useIsMobile } from 'helpers/system-helper';

import styles from './FullWindowPanel.module.scss';

interface Context {
  isMobile: boolean;
  isDesktop: boolean;
  isWindows: boolean;
}

export const FullWindowPanelContext = createContext<Context>({
  isMobile: false,
  isWindows: false,
  isDesktop: true,
});

interface Props {
  onClose: () => void;
  mobileTitle: string | JSX.Element;
  renderMobileFixedContent?: () => React.ReactNode;
  renderMobileContents?: () => React.ReactNode;
  renderContents?: () => React.ReactNode;
}

const FullWindowPanel = ({
  onClose,
  mobileTitle,
  renderMobileFixedContent,
  renderMobileContents,
  renderContents,
}: Props): JSX.Element => {
  const isMobile = useIsMobile();
  const isWindows = useMemo(() => window.os === 'Windows', []);
  const web = useMemo(() => isWeb(), []);

  if (isMobile)
    return (
      <FullWindowPanelContext.Provider value={{ isMobile, isWindows, isDesktop: !web }}>
        <FloatingPanel
          className={classNames(styles.container, {
            [styles.windows]: isWindows,
            [styles.desktop]: !web,
          })}
          anchors={[0, window.innerHeight - layoutConstants.titlebarHeight]}
          title={mobileTitle}
          fixedContent={renderMobileFixedContent?.()}
          onClose={onClose}
        >
          {renderMobileContents?.()}
        </FloatingPanel>
      </FullWindowPanelContext.Provider>
    );

  return (
    <FullWindowPanelContext.Provider value={{ isMobile, isWindows, isDesktop: !web }}>
      <div
        className={classNames(styles.container, {
          [styles.windows]: isWindows,
          [styles.desktop]: !web,
        })}
      >
        {renderContents?.()}
      </div>
    </FullWindowPanelContext.Provider>
  );
};

export default FullWindowPanel;
