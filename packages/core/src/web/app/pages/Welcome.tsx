import React, { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
  CloudOutlined,
  FolderOpenOutlined,
  LikeOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { CapsuleTabs } from 'antd-mobile';
import classNames from 'classnames';

import beamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import funcs from '@core/app/actions/beambox/svgeditor-function-wrapper';
import tabController from '@core/app/actions/tabController';
import Tabs from '@core/app/components/beambox/top-bar/tabs/Tabs';
import Chat from '@core/app/components/Chat';
import type { IBanner } from '@core/app/components/welcome/Banners';
import Banners from '@core/app/components/welcome/Banners';
import TabFollowUs from '@core/app/components/welcome/TabFollowUs';
import TabHelpCenter from '@core/app/components/welcome/TabHelpCenter';
import TabMyCloud from '@core/app/components/welcome/TabMyCloud';
import TabRecentFiles from '@core/app/components/welcome/TabRecentFiles';
import ThemedButton from '@core/app/components/welcome/ThemedButton';
import UserInfo from '@core/app/components/welcome/UserInfo';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { DmktIcon } from '@core/app/icons/icons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useStorageStore } from '@core/app/stores/storageStore';
import { axiosFluxId, fluxIDEvents, getCurrentUser } from '@core/helpers/api/flux-id';
import { hashMap } from '@core/helpers/hashHelper';
import isWeb from '@core/helpers/is-web';
import localeHelper from '@core/helpers/locale-helper';
import { isMac, useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import communicator from '@core/implementations/communicator';
import type { IUser } from '@core/interfaces/IUser';

import styles from './Welcome.module.scss';

type MenuKey = 'beamy' | 'dmkt' | 'follow' | 'help-center' | 'my-cloud' | 'recent-files';
interface MenuItem {
  icon: ReactNode;
  key: MenuKey;
  label: string;
  onClick?: () => void;
}

const twBanner: IBanner = {
  image_desktop: 'core-img/welcome-page/banner_tw_desktop.png',
  image_mobile: 'core-img/welcome-page/banner_tw_mobile.png',
  url: 'https://tw-shop.flux3dp.com/',
};

const naBanner: IBanner = {
  image_desktop: 'core-img/welcome-page/banner_na_desktop.png',
  image_mobile: 'core-img/welcome-page/banner_na_mobile.png',
  url: 'https://shop.flux3dp.com/',
};

const Welcome = (): ReactNode => {
  const {
    my_cloud: tMyCloud,
    topbar: { menu: tMenu },
    welcome_page: t,
  } = useI18n();
  const activeLang = useStorageStore((state) => state['active-lang']) ?? 'en';
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState<IUser | null>(getCurrentUser());
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const setUser = useCallback((user: IUser | null) => setCurrentUser(user ? { ...user } : user), []);
  const isDesktopMac = useMemo(() => !isWeb() && isMac(), []);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const defaultShopBanner = useMemo(() => {
    if (localeHelper.isTw) return twBanner;
    else if (localeHelper.isNorthAmerica) return naBanner;
    else return null;
  }, []);

  const fetchBanners = useCallback(async () => {
    try {
      let lang = activeLang;

      if (localeHelper.isNorthAmerica) lang = '_na';
      else if (localeHelper.isTw) lang = '_tw';

      const resp = await axiosFluxId.get(`/api/beam-studio/banners?locale=${lang}`);

      if (resp.data.banners.length > 0) {
        setBanners(resp.data.banners);

        return;
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    }
    setBanners(defaultShopBanner ? [defaultShopBanner] : []);
  }, [activeLang, defaultShopBanner]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    if (!isWeb() && !tabController.getIsWelcomeTab()) {
      // Fix tab content after reset
      window.location.hash = hashMap.editor;
    } else {
      const onFullScreenChange = (_: unknown, isFullScreen: boolean) => setIsFullScreen(isFullScreen);

      communicator.on('window-fullscreen', onFullScreenChange);
      communicator.on('NEW_APP_MENU', beamboxGlobalInteraction.attach);
      beamboxGlobalInteraction.attach();
      window.homePage = hashMap.welcome;
      setIsLoading(false);
      communicator.send('FRONTEND_READY');

      return () => {
        beamboxGlobalInteraction.detach();
        communicator.off('NEW_APP_MENU', beamboxGlobalInteraction.attach);
        communicator.off('window-fullscreen', onFullScreenChange);
      };
    }
  }, []);

  useEffect(() => {
    fluxIDEvents.on('update-user', setUser);
    // Init user again in case it was updated before fluxIDEvents.on
    setUser(getCurrentUser());

    return () => {
      fluxIDEvents.off('update-user', setUser);
    };
  }, [setUser]);

  const menuItems = [
    !isWeb() && {
      icon: <FolderOpenOutlined />,
      key: 'recent-files',
      label: t.recent_files,
    },
    {
      icon: <CloudOutlined />,
      key: 'my-cloud',
      label: tMyCloud.title,
    },
    {
      icon: <LikeOutlined />,
      key: 'follow',
      label: tMenu.follow_us,
    },
    {
      icon: <QuestionCircleOutlined />,
      key: 'help-center',
      label: tMenu.help_center,
    },
    {
      icon: <LeftPanelIcons.Beamy className={styles['beamy-icon']} />,
      key: 'beamy',
      label: 'Beamy',
    },
    {
      icon: <DmktIcon className={styles['dmkt-icon']} />,
      key: 'dmkt',
      label: 'Design Market',
    },
  ].filter(Boolean) as MenuItem[];
  const [activeKey, setActiveKey] = useState<MenuKey>(menuItems[0].key);
  const onChangeActiveKey = (key: 'shop' | MenuKey) => {
    if (key === 'dmkt') {
      browser.open(tMenu.link.design_market);
    } else if (key === 'shop') {
      browser.open(defaultShopBanner!.url);
    } else {
      setActiveKey(key);
    }
  };

  const contents = {
    beamy: <Chat />,
    dmkt: null,
    follow: <TabFollowUs />,
    'help-center': <TabHelpCenter />,
    'my-cloud': <TabMyCloud user={currentUser} />,
    'recent-files': <TabRecentFiles />,
  };

  const isFullTab = useMemo(() => activeKey === 'beamy', [activeKey]);

  return isLoading ? (
    <div />
  ) : (
    <div className={styles.container}>
      {!isWeb() && (
        <div
          className={classNames(styles['top-bar'], {
            [styles.draggable]: isDesktopMac,
            [styles.mac]: isDesktopMac,
            [styles.space]: isDesktopMac && !isFullScreen,
          })}
        >
          <Tabs inverse />
        </div>
      )}
      <div className={styles.header}>
        <div className={styles.logo}>
          <FluxIcons.FluxLogo />
        </div>
        <ThemedButton ghost icon={<FolderOpenOutlined />} onClick={funcs.importImage} theme="white">
          {!isMobile && tMenu.open}
        </ThemedButton>
        <ThemedButton icon={<PlusOutlined />} onClick={funcs.clearScene} theme="yellow">
          {!isMobile && t.new_project}
        </ThemedButton>
      </div>
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <UserInfo user={currentUser} />
          {isMobile ? (
            <CapsuleTabs
              activeKey={activeKey}
              className={styles.tabs}
              onChange={(key) => onChangeActiveKey(key as MenuKey)}
            >
              {menuItems.map((item) => (
                <CapsuleTabs.Tab
                  key={item.key}
                  title={
                    <div className={styles['menu-item']}>
                      {item.icon} {item.label}
                    </div>
                  }
                />
              ))}
              {defaultShopBanner && (
                <CapsuleTabs.Tab
                  className={styles['cta-tab']}
                  key="shop"
                  title={
                    <div className={styles['menu-item']}>
                      <ShoppingOutlined /> {t.shop}
                    </div>
                  }
                />
              )}
            </CapsuleTabs>
          ) : (
            <div className={styles.menu}>
              {menuItems.map((item) => (
                <div
                  className={classNames(styles['menu-item'], { [styles.active]: activeKey === item.key })}
                  key={item.key}
                  onClick={() => onChangeActiveKey(item.key)}
                >
                  {item.icon} {item.label}
                </div>
              ))}
            </div>
          )}
          {!isMobile && defaultShopBanner && (
            <div className={styles.cta}>
              <ThemedButton
                block
                icon={<ShoppingOutlined />}
                onClick={() => browser.open(defaultShopBanner.url)}
                theme="yellow"
              >
                {t.shop_products}
              </ThemedButton>
            </div>
          )}
        </div>
        <div className={classNames(styles.main, { [styles['no-padding']]: isFullTab })}>
          {!isFullTab && !isMobile && <Banners banners={banners} />}
          <div className={styles[activeKey]}>{contents[activeKey]}</div>
          {!isFullTab && isMobile && <Banners banners={banners} />}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
