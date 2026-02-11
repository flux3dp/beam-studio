import React, { use } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { FullWindowPanelContext } from '@core/app/widgets/FullWindowPanel/FullWindowPanel';

import styles from './BackButton.module.scss';

interface Props {
  children?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const BackButton = ({ children, className = '', onClose }: Props): React.JSX.Element => {
  const { isDesktop, isWindows } = use(FullWindowPanelContext);

  return (
    <Button
      className={classNames(
        styles.enhancer,
        styles.button,
        {
          [styles.desktop]: isDesktop,
          [styles.windows]: isWindows,
        },
        className,
      )}
      icon={<TopBarIcons.Undo />}
      onClick={onClose}
      type="text"
    >
      {children}
    </Button>
  );
};

export default BackButton;
