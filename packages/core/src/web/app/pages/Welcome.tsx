import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
  CloudOutlined,
  FolderOpenOutlined,
  LikeOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Flex } from 'antd';
import classNames from 'classnames';

import dialogCaller from '@core/app/actions/dialog-caller';
import tabController from '@core/app/actions/tabController';
import Tabs from '@core/app/components/beambox/top-bar/tabs/Tabs';
import Banners from '@core/app/components/welcome/Banners';
import TabBeamy from '@core/app/components/welcome/TabBeamy';
import TabFollowUs from '@core/app/components/welcome/TabFollowUs';
import TabHelpCenter from '@core/app/components/welcome/TabHelpCenter';
import TabMyCloud from '@core/app/components/welcome/TabMyCloud';
import TabRecentFiles from '@core/app/components/welcome/TabRecentFiles';
import ThemedButton from '@core/app/components/welcome/ThemedButton';
import { getSocialMedia } from '@core/app/constants/social-media-constants';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { DmktIcon } from '@core/app/icons/icons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { fluxIDEvents, getCurrentUser, signOut } from '@core/helpers/api/flux-id';
import { mockT, todo } from '@core/helpers/dev-helper';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import dialog from '@core/implementations/dialog';
import type { IUser } from '@core/interfaces/IUser';

import styles from './Welcome.module.scss';

type MenuKey = 'beamy' | 'dmkt' | 'follow' | 'help-center' | 'my-cloud' | 'recent-files';
interface MenuItem {
  icon: ReactNode;
  key: MenuKey;
  label: string;
  onClick?: () => void;
}

const Welcome = (): ReactNode => {
  const {
    flux_id_login: tFluxIdLogin,
    my_cloud: tMyCloud,
    topbar: { menu: tMenu },
  } = useI18n();
  const [currentUser, setCurrentUser] = useState<IUser | null>(getCurrentUser());
  const nickname: string | undefined = useMemo(() => currentUser?.info?.nickname ?? currentUser?.email, [currentUser]);
  const setUser = useCallback((user: IUser | null) => setCurrentUser(user ? { ...user } : user), []);
  const socialMedia = useMemo(() => getSocialMedia(), []);

  useEffect(() => {
    window.isFirstTab = false;
  }, []);

  const openFile = async () => {
    // open file dialog and load the selected file on canvas
    const file = await dialog.getFileFromDialog({
      filters: [
        {
          extensions: [
            'png',
            'jpg',
            'jpeg',
            'jpe',
            'jif',
            'jfif',
            'jfi',
            'bmp',
            'jp2',
            'j2k',
            'jpf',
            'jpx',
            'jpm',
            'dxf',
            'ai',
            'pdf',
            'svg',
            'bvg',
            'beam',
            'webp',
          ],
          name: 'Images',
        },
      ],
    });

    if (file) {
      window.importingFile = { data: file, type: 'normal' };

      if (isWeb()) {
        location.hash = '#/studio/beambox';
      } else {
        tabController.addNewTab();
        todo('openFile in desktop app', 'add new tab, move to it and import the file');
      }
    }
  };

  const startNewProject = () => {
    if (isWeb()) {
      location.hash = '#/studio/beambox';
    } else {
      tabController.addNewTab();
      todo('startNewProject in desktop app', 'add new tab and move to it');
    }
  };

  const menuItems = [
    !isWeb() && {
      icon: <FolderOpenOutlined />,
      key: 'recent-files',
      label: mockT('Recent Files'),
    },
    {
      icon: <CloudOutlined />,
      key: 'my-cloud',
      label: tMyCloud.title,
    },
    {
      icon: <LikeOutlined />,
      key: 'follow',
      label: mockT('Follow Us'),
    },
    {
      icon: <QuestionCircleOutlined />,
      key: 'help-center',
      label: tMenu.help_center,
    },
    {
      icon: <LeftPanelIcons.Beamy />,
      key: 'beamy',
      label: 'Beamy',
    },
    {
      icon: <DmktIcon className={styles['dmkt-icon']} />,
      key: 'dmkt',
      label: 'Design Market',
      onClick: () => browser.open(tMenu.link.design_market),
    },
  ].filter(Boolean) as MenuItem[];
  const [activeKey, setActiveKey] = useState<MenuKey>(menuItems[0].key);

  const contents = {
    beamy: <TabBeamy />,
    dmkt: null,
    follow: <TabFollowUs />,
    'help-center': <TabHelpCenter />,
    'my-cloud': <TabMyCloud user={currentUser} />,
    'recent-files': <TabRecentFiles startNewProject={startNewProject} />,
  };

  const isFullTab = useMemo(() => activeKey === 'beamy', [activeKey]);

  useEffect(() => {
    fluxIDEvents.on('update-user', setUser);

    return () => {
      fluxIDEvents.removeListener('update-user', setUser);
    };
  }, [setUser]);

  return (
    <div className={styles.container}>
      {!isWeb() && (
        <div className={styles['top-bar']}>
          <Tabs inverse />
        </div>
      )}
      <div className={styles.header}>
        <div className={styles.logo}>
          <FluxIcons.FluxLogo />
        </div>
        <ThemedButton ghost icon={<FolderOpenOutlined />} onClick={openFile} theme="white">
          {tMenu.open}
        </ThemedButton>
        <ThemedButton icon={<PlusOutlined />} onClick={startNewProject} theme="yellow">
          {mockT('New Project')}
        </ThemedButton>
      </div>
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.info}>
            <Flex align="center" gap={16}>
              <Avatar
                alt="avatar"
                className={styles.avatar}
                icon={<TopBarIcons.Account className={styles['default-avatar']} />}
                size={52}
                src={currentUser?.info?.avatar || undefined}
              />
              {nickname ? (
                <div className={styles.nickname}>{nickname}</div>
              ) : (
                <div className={styles['login-hint']}>
                  {mockT('Get Free AI credits on us when you sign up for a FLUX account!')}
                </div>
              )}
            </Flex>
            {currentUser ? (
              <>
                <div className={styles.email}>{currentUser.email}</div>
                <Flex gap={8}>
                  <Button block onClick={signOut} size="small" type="default">
                    {tMenu.sign_out}
                  </Button>
                  <ThemedButton
                    block
                    onClick={() => browser.open(tFluxIdLogin.flux_plus.member_center_url)}
                    size="small"
                    theme="yellow"
                  >
                    {mockT('Member Center')}
                  </ThemedButton>
                </Flex>
              </>
            ) : (
              <ThemedButton block onClick={() => dialogCaller.showLoginDialog()} theme="yellow">
                {tMenu.sign_in}
              </ThemedButton>
            )}
          </div>
          <div className={styles.menu}>
            {menuItems.map((item) => (
              <div
                className={classNames(styles['menu-item'], { [styles.active]: activeKey === item.key })}
                key={item.key}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else setActiveKey(item.key);
                }}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
          <div className={styles.cta}>
            <ThemedButton
              block
              icon={<ShoppingOutlined />}
              onClick={() => browser.open(socialMedia.shop.link)}
              theme="yellow"
            >
              {mockT('Shop FLUX Products')}
            </ThemedButton>
          </div>
        </div>
        <div className={classNames(styles.main, { [styles['no-padding']]: isFullTab })}>
          {!isFullTab && <Banners />}
          <div>{contents[activeKey]}</div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
