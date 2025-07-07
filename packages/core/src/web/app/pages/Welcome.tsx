import { type ReactNode, useMemo, useState } from 'react';

import {
  CloudOutlined,
  FolderOpenOutlined,
  LikeOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';

import Tabs from '@core/app/components/beambox/top-bar/tabs/Tabs';
import Banners from '@core/app/components/welcome/Banners';
import TabBeami from '@core/app/components/welcome/TabBeami';
import TabFollowUs from '@core/app/components/welcome/TabFollowUs';
import TabHelpCenter from '@core/app/components/welcome/TabHelpCenter';
import TabMyCloud from '@core/app/components/welcome/TabMyCloud';
import TabRecentFiles from '@core/app/components/welcome/TabRecentFiles';
import ThemedButton from '@core/app/components/welcome/ThemedButton';
import { DmktIcon } from '@core/app/icons/icons';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import dialog from '@core/implementations/dialog';

import styles from './Welcome.module.scss';

type MenuKey = 'beami' | 'dmkt' | 'follow' | 'help-center' | 'my-cloud' | 'recent-files';
interface MenuItem {
  icon: ReactNode;
  key: MenuKey;
  label: string;
  onClick?: () => void;
}

const Welcome = (): ReactNode => {
  const {
    my_cloud: tMyCloud,
    topbar: {
      menu: { link: tLink },
    },
  } = useI18n();
  const menuItems = [
    !isWeb() && {
      icon: <FolderOpenOutlined />,
      key: 'recent-files',
      label: 'Recent Files',
    },
    {
      icon: <CloudOutlined />,
      key: 'my-cloud',
      label: tMyCloud.title,
    },
    {
      icon: <LikeOutlined />,
      key: 'follow',
      label: 'Follow Us',
    },
    {
      icon: <QuestionCircleOutlined />,
      key: 'help-center',
      label: 'Help Center',
    },
    {
      icon: <QuestionCircleOutlined />,
      key: 'beami',
      label: 'Beami AI',
    },
    {
      icon: <DmktIcon className={styles['dmkt-icon']} />,
      key: 'dmkt',
      label: 'Design Market',
      onClick: () => browser.open(tLink.design_market),
    },
  ].filter(Boolean) as MenuItem[];
  const [activeKey, setActiveKey] = useState<MenuKey>(menuItems[0].key);

  const contents = {
    beami: <TabBeami />,
    dmkt: null,
    follow: <TabFollowUs />,
    'help-center': <TabHelpCenter />,
    'my-cloud': <TabMyCloud />,
    'recent-files': <TabRecentFiles />,
  };

  const isFullTab = useMemo(() => activeKey === 'beami', [activeKey]);

  const openFile = async () => {
    // TODO:
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
      window.importingFile = file;
      location.hash = '#/studio/beambox';
    }
  };

  const startNewProject = () => {
    if (isWeb()) {
      location.hash = '#/studio/beambox';
    } else {
      // add new tab and move to it
    }
  };

  return (
    <div className={styles.container}>
      {!isWeb() && <Tabs />}
      <div className={styles['top-bar']}>
        <div className={styles.logo}>Logo img</div>
        <ThemedButton ghost icon={<FolderOpenOutlined />} onClick={openFile} theme="white">
          Open
        </ThemedButton>
        <ThemedButton icon={<PlusOutlined />} onClick={startNewProject} theme="yellow">
          New Project
        </ThemedButton>
      </div>
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.info}>User Avatar + login info</div>
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
            <ThemedButton block icon={<ShoppingOutlined />} theme="yellow">
              Shop FLUX Products
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
