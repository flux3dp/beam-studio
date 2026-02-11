import React, { use } from 'react';

import classNames from 'classnames';

import { FullWindowPanelContext } from '@core/app/widgets/FullWindowPanel/FullWindowPanel';

import styles from './Footer.module.scss';

interface Props {
  children?: React.ReactNode;
  className?: string;
}

const Footer = ({ children, className = '' }: Props): React.JSX.Element => {
  const { isDesktop, isMobile, isWindows } = use(FullWindowPanelContext);

  return (
    <div
      className={classNames(
        styles.footer,
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

export default Footer;
