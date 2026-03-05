import React, { type ReactNode, useMemo } from 'react';

import { Avatar, Flex } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import ThemedButton from '@core/app/components/welcome/ThemedButton';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { IUser } from '@core/interfaces/IUser';

import styles from './UserInfo.module.scss';

interface Props {
  user: IUser | null;
}

const UserInfo = ({ user }: Props): ReactNode => {
  const {
    topbar: { menu: tMenu },
    welcome_page: t,
  } = useI18n();
  const isMobile = useIsMobile();
  const nickname: string | undefined = useMemo(() => user?.info?.nickname ?? user?.email, [user]);

  return (
    <div className={styles.info}>
      {user ? (
        <button className={styles['user-profile-btn']} onClick={dialogCaller.showFluxCreditDialog} type="button">
          <Flex align="center" gap={16}>
            <Avatar
              alt="avatar"
              className={styles.avatar}
              icon={<TopBarIcons.Account className={styles['default-avatar']} />}
              size={isMobile ? 40 : 52}
              src={user?.info?.avatar || undefined}
            />
            <Flex align="start" justify="center" vertical>
              <div className={styles.nickname}>{nickname}</div>
              <div className={styles.email}>{user.email}</div>
            </Flex>
          </Flex>
        </button>
      ) : (
        <div className={styles['login-hint-wrapper']}>
          <div className={styles['login-hint']}>{t.not_login_placeholder}</div>
        </div>
      )}

      <div className={styles['action-section']}>
        {user ? (
          <ThemedButton
            block
            icon={<TopBarIcons.Account />}
            onClick={() => browser.open(t.member_center_url)}
            size="large"
            theme="yellow"
          >
            {t.member_center}
          </ThemedButton>
        ) : (
          <ThemedButton block onClick={() => dialogCaller.showLoginDialog()} size="large" theme="yellow">
            {tMenu.login_or_register}
          </ThemedButton>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
