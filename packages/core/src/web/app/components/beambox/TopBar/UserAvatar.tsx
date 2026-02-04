import React from 'react';

import { Avatar, Badge } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import type { IUser } from '@core/interfaces/IUser';

import styles from './UserAvatar.module.scss';

interface Props {
  user: IUser | null;
}

const UserAvatar = ({ user }: Props): React.JSX.Element => (
  <div className={styles['user-avatar']} onClick={() => dialogCaller.showFluxCreditDialog()}>
    <Badge
      count={user?.info?.subscription?.is_valid ? <FluxIcons.FluxPlus className={styles.badge} /> : 0}
      offset={[-4, 4]}
    >
      <Avatar
        alt="avatar"
        icon={<TopBarIcons.Account className={styles['default-avatar']} />}
        size={28}
        src={user?.info?.avatar || undefined}
      />
    </Badge>
  </div>
);

export default UserAvatar;
