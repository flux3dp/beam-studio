import classNames from 'classnames';
import React, { useContext } from 'react';

import { FullWindowPanelContext } from 'app/widgets/FullWindowPanel/FullWindowPanel';

import styles from './Footer.module.scss';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

const Footer = ({ className = '', children }: Props): JSX.Element => {
  const { isDesktop, isWindows, isMobile } = useContext(FullWindowPanelContext);
  return (
    <div
      className={classNames(
        styles.footer,
        {
          [styles.mobile]: isMobile,
          [styles.windows]: isWindows,
          [styles.desktop]: isDesktop,
        },
        className
      )}
    >
      {children}
    </div>
  );
};

export default Footer;
