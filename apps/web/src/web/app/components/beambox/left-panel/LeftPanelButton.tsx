import classNames from 'classnames';
import React from 'react';
import { Badge } from 'antd';

import FluxIcons from 'app/icons/flux/FluxIcons';

import styles from './LeftPanelButton.module.scss';

interface Props {
  id: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  showBadge?: boolean;
}

function LeftPanelButton({
  id,
  title,
  icon,
  onClick,
  active = false,
  disabled = false,
  showBadge = false,
}: Props): JSX.Element {
  return (
    <div
      id={id}
      className={classNames(styles.container, {
        [styles.active]: active,
        [styles.disabled]: disabled,
      })}
      title={title}
      onClick={disabled ? undefined : onClick}
    >
      <Badge
        className={styles.badge}
        count={showBadge ? <FluxIcons.FluxPlus className={styles['flux-plus']} /> : 0}
        offset={[-4, 6]}
      >
        {icon}
      </Badge>
    </div>
  );
}

export default LeftPanelButton;
