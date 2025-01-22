import React from 'react';

import { Badge } from 'antd';
import classNames from 'classnames';

import FluxIcons from '@core/app/icons/flux/FluxIcons';

import styles from './LeftPanelButton.module.scss';

interface Props {
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  id: string;
  onClick: () => void;
  showBadge?: boolean;
  title: string;
}

function LeftPanelButton({
  active = false,
  disabled = false,
  icon,
  id,
  onClick,
  showBadge = false,
  title,
}: Props): React.JSX.Element {
  return (
    <div
      className={classNames(styles.container, {
        [styles.active]: active,
        [styles.disabled]: disabled,
      })}
      id={id}
      onClick={disabled ? undefined : onClick}
      title={title}
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
