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

import tabController from '@core/app/actions/tabController';
import Chat from '@core/app/components/beambox/svg-editor/Chat';
import Tabs from '@core/app/components/beambox/top-bar/tabs/Tabs';
import type { IBanner } from '@core/app/components/welcome/Banners';
import Banners from '@core/app/components/welcome/Banners';
import TabFollowUs from '@core/app/components/welcome/TabFollowUs';
import TabHelpCenter from '@core/app/components/welcome/TabHelpCenter';
import TabMyCloud from '@core/app/components/welcome/TabMyCloud';
import TabRecentFiles from '@core/app/components/welcome/TabRecentFiles';
import ThemedButton from '@core/app/components/welcome/ThemedButton';
import UserInfo from '@core/app/components/welcome/UserInfo';
import { getSocialMedia } from '@core/app/constants/social-media-constants';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import { DmktIcon } from '@core/app/icons/icons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { axiosFluxId, fluxIDEvents, getCurrentUser } from '@core/helpers/api/flux-id';
import { checkTabCount, setFileInAnotherTab } from '@core/helpers/fileImportHelper';
import { hashMap } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import { useIsMobile } from '@core/helpers/system-helper';
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

const twBanners: IBanner[] = [
  {
    image_desktop: 'https://cdn.shopify.com/s/files/1/0668/8830/2868/files/bs_banner_desktop.png?v=1752660857',
    image_mobile: 'https://cdn.shopify.com/s/files/1/0668/8830/2868/files/tw_bs_banner_mobile.png?v=1752660857',
    url: 'https://tw-shop.flux3dp.com/',
  },
];

const enBanners: IBanner[] = [
  {
    image_desktop:
      'https://cdn.shopify.com/s/files/1/0624/2415/4305/files/Shopify-Banner_FLUX-Shop_Desktop.webp?v=1741090136',
    image_mobile:
      'https://cdn.shopify.com/s/files/1/0624/2415/4305/files/Shopify-Banner_FLUX-Shop_Mobile.webp?v=1741090152',
    url: 'https://shop.flux3dp.com/',
  },
];

const Welcome = (): ReactNode => {
  const {
    my_cloud: tMyCloud,
    topbar: { menu: tMenu },
    welcome_page: t,
  } = useI18n();
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState<IUser | null>(getCurrentUser());
  const isTW = useMemo(() => i18n.getActiveLang() === 'zh-TW', []);
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const setUser = useCallback((user: IUser | null) => setCurrentUser(user ? { ...user } : user), []);
  const socialMedia = useMemo(() => getSocialMedia(), []);

  const fetchBanners = useCallback(async () => {
    try {
      const resp = await axiosFluxId.get(`/api/beam-studio/banners?locale=${i18n.getActiveLang()}`);

      if (resp.data.banners.length > 0) {
        setBanners(resp.data.banners);

        return;
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    }
    setBanners(isTW ? twBanners : enBanners);
  }, [isTW]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    if (!isWeb() && !tabController.getIsWelcomeTab()) {
      // Fix tab content after reset
      window.location.hash = hashMap.editor;
    } else {
      window.homePage = hashMap.welcome;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fluxIDEvents.on('update-user', setUser);

    return () => {
      fluxIDEvents.off('update-user', setUser);
    };
  }, [setUser]);

  const openFile = async () => {
    if (!checkTabCount()) return;

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
      setFileInAnotherTab({ data: file, type: 'normal' });
    }
  };

  const startNewProject = () => {
    if (isWeb()) {
      location.hash = hashMap.editor;
    } else if (checkTabCount()) {
      tabController.addNewTab();
    }
  };

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
      browser.open(socialMedia.shop.link);
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
    'recent-files': <TabRecentFiles startNewProject={startNewProject} />,
  };

  const isFullTab = useMemo(() => activeKey === 'beamy', [activeKey]);

  return isLoading ? (
    <div />
  ) : (
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
          {!isMobile && tMenu.open}
        </ThemedButton>
        <ThemedButton icon={<PlusOutlined />} onClick={startNewProject} theme="yellow">
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
              <CapsuleTabs.Tab
                className={styles['cta-tab']}
                key="shop"
                title={
                  <div className={styles['menu-item']}>
                    <ShoppingOutlined /> {t.shop}
                  </div>
                }
              />
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
          {!isMobile && (
            <div className={styles.cta}>
              <ThemedButton
                block
                icon={<ShoppingOutlined />}
                onClick={() => browser.open(socialMedia.shop.link)}
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
