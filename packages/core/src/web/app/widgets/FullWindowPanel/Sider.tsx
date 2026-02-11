import React, { use } from 'react';

import classNames from 'classnames';

import { FullWindowPanelContext } from '@core/app/widgets/FullWindowPanel/FullWindowPanel';

import styles from './Sider.module.scss';

interface Props {
  children?: React.ReactNode;
  className?: string;
}

const Sider = ({ children, className = '' }: Props): React.JSX.Element => {
  const { isDesktop, isMobile, isWindows } = use(FullWindowPanelContext);

  return (
    <div
      className={classNames(
        styles.sider,
        {
          [styles.desktop]: isDesktop,
          [styles.mobile]: isMobile,
          [styles.windows]: isWindows,
        },
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Sider;
