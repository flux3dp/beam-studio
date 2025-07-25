import React, { type ReactNode, useMemo } from 'react';

import { Avatar, Button, Flex } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import ThemedButton from '@core/app/components/welcome/ThemedButton';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { signOut } from '@core/helpers/api/flux-id';
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
      <Flex align="center" gap={16}>
        <Avatar
          alt="avatar"
          className={styles.avatar}
          icon={<TopBarIcons.Account className={styles['default-avatar']} />}
          onClick={dialogCaller.showFluxCreditDialog}
          size={isMobile ? 32 : 52}
          src={user?.info?.avatar || undefined}
        />
        {nickname ? (
          <div className={styles.nickname}>{nickname}</div>
        ) : (
          <div className={styles['login-hint']}>{t.not_login_placeholder}</div>
        )}
      </Flex>
      {user ? (
        <>
          {!isMobile && <div className={styles.email}>{user.email}</div>}
          <Flex gap={8}>
            <Button block onClick={signOut} size="small" type="default">
              {tMenu.logout}
            </Button>
            <ThemedButton block onClick={() => browser.open(t.member_center_url)} size="small" theme="yellow">
              {t.member_center}
            </ThemedButton>
          </Flex>
        </>
      ) : (
        <ThemedButton block onClick={() => dialogCaller.showLoginDialog()} theme="yellow">
          {tMenu.login_or_register}
        </ThemedButton>
      )}
    </div>
  );
};

export default UserInfo;
