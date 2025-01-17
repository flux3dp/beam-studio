import React from 'react';
import { Avatar, Badge } from 'antd';

import dialogCaller from 'app/actions/dialog-caller';
import FluxIcons from 'app/icons/flux/FluxIcons';
import TopBarIcons from 'app/icons/top-bar/TopBarIcons';
import { IUser } from 'interfaces/IUser';

import styles from './UserAvatar.module.scss';

interface Props {
  user: IUser | null;
}

const UserAvatar = ({ user }: Props): JSX.Element => (
  <div className={styles['user-avatar']} onClick={() => dialogCaller.showFluxCreditDialog()}>
    <Badge
      count={
        user?.info?.subscription?.is_valid ? <FluxIcons.FluxPlus className={styles.badge} /> : 0
      }
      offset={[-4, 4]}
    >
      <Avatar
        icon={<TopBarIcons.Account className={styles['default-avatar']} />}
        src={user?.info?.avatar || undefined}
        size={28}
        alt="avatar"
      />
    </Badge>
  </div>
);

export default UserAvatar;
