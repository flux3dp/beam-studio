import classNames from 'classnames';
import React, { useContext } from 'react';
import { Button } from 'antd';

import TopBarIcons from 'app/icons/top-bar/TopBarIcons';
import { FullWindowPanelContext } from 'app/widgets/FullWindowPanel/FullWindowPanel';

import styles from './BackButton.module.scss';

interface Props {
  children?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const BackButton = ({ className = '', children, onClose }: Props): JSX.Element => {
  const { isDesktop, isWindows } = useContext(FullWindowPanelContext);
  return (
    <Button
      className={classNames(
        styles.enhancer,
        styles.button,
        {
          [styles.windows]: isWindows,
          [styles.desktop]: isDesktop,
        },
        className
      )}
      type="text"
      icon={<TopBarIcons.Undo />}
      onClick={onClose}
    >
      {children}
    </Button>
  );
};

export default BackButton;
