import React from 'react';

import { Badge } from 'antd';
import classNames from 'classnames';

import FluxIcons from '@core/app/icons/flux/FluxIcons';

import styles from './LeftPanelButton.module.scss';

interface Props {
  active?: boolean;
  className?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  id: string;
  onClick: () => void;
  showBadge?: boolean;
  style?: React.CSSProperties;
  title: string;
}

function LeftPanelButton({
  active = false,
  className = undefined,
  disabled = false,
  icon,
  id,
  onClick,
  showBadge = false,
  style,
  title,
}: Props): React.JSX.Element {
  return (
    <div
      className={classNames(styles.container, { [styles.active]: active, [styles.disabled]: disabled }, className)}
      id={id}
      onClick={disabled ? undefined : onClick}
      style={style}
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
