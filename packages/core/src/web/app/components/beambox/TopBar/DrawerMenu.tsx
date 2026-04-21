import React, { useRef, useState } from 'react';

import { CheckOutlined, CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Drawer } from 'antd';

import { MenuEvents } from '@core/app/constants/ipcEvents';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import communicator from '@core/implementations/communicator';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import styles from './DrawerMenu.module.scss';
import type { MenuNode } from './useMenuData';
import useMenuData from './useMenuData';

interface TriggerProps {
  onClick: () => void;
}

export function DrawerMenuTrigger({ onClick }: TriggerProps): React.JSX.Element {
  return (
    <button className={styles.trigger} onClick={onClick} type="button">
      <img className={styles['trigger-logo']} src="img/beam-studio-v2.svg" />
      <span className={styles['trigger-hamburger']}>
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}

interface Props {
  email?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ROOT_TITLE = 'Beam Studio';

export default function DrawerMenu({ email, isOpen, onClose }: Props): React.JSX.Element {
  const menuData = useMenuData(email);
  const menuCms = useI18n().topbar.menu;
  // Navigation stack: each entry is { title, nodes }
  const [navStack, setNavStack] = useState<Array<{ nodes: MenuNode[]; title: string }>>([]);
  const pendingAction = useRef<null | { device?: IDeviceInfo; id: string }>(null);

  const currentTitle = navStack.length > 0 ? navStack[navStack.length - 1].title : ROOT_TITLE;
  const currentNodes = navStack.length > 0 ? navStack[navStack.length - 1].nodes : menuData;

  const handleAfterOpenChange = (open: boolean) => {
    if (!open) {
      setNavStack([]);

      if (pendingAction.current) {
        const { device, id } = pendingAction.current;

        pendingAction.current = null;
        communicator.send(MenuEvents.MenuClick, {
          id,
          machineName: device?.name,
          serial: device?.serial,
          uuid: device?.uuid,
        });
      }
    }
  };

  const handleBack = () => {
    setNavStack((prev) => prev.slice(0, -1));
  };

  const handleNodeClick = (node: MenuNode) => {
    if (node.disabled) return;

    if (node.type === 'submenu' && node.children) {
      setNavStack((prev) => [...prev, { nodes: node.children!, title: node.label ?? '' }]);

      return;
    }

    if (node.url) {
      browser.open(node.url);
      onClose();

      return;
    }

    if (node.id) {
      pendingAction.current = { device: node.device, id: node.id };
      onClose();
    }
  };

  const getNodeLabel = (node: MenuNode): string => {
    if (node.label) return node.label;

    if (node.hotkey) return menuCms[node.hotkey] ?? '';

    return '';
  };

  const visibleNodes = currentNodes.filter((node) => node.visible !== false);

  return (
    <Drawer
      afterOpenChange={handleAfterOpenChange}
      closable={false}
      onClose={onClose}
      open={isOpen}
      placement="left"
      rootClassName={styles['drawer-menu']}
      title={
        <div className={styles.header}>
          {navStack.length > 0 ? (
            <button className={styles['back-button']} onClick={handleBack} type="button">
              <LeftOutlined />
              {currentTitle}
            </button>
          ) : (
            <span className={styles.title}>{currentTitle}</span>
          )}
          <button className={styles['close-button']} onClick={onClose} type="button">
            <CloseOutlined />
          </button>
        </div>
      }
      width={320}
    >
      <ul className={styles['menu-list']}>
        {visibleNodes.map((node, index) => {
          if (node.type === 'divider') {
            return <hr className={styles.divider} key={`divider-${index}`} />;
          }

          const label = getNodeLabel(node);
          const isCheckbox = node.type === 'checkbox';
          const isSubmenu = node.type === 'submenu';

          return (
            <li
              className={`${styles['menu-item']}${node.disabled ? ` ${styles.disabled}` : ''}`}
              key={node.id ?? `item-${index}`}
              onClick={() => handleNodeClick(node)}
            >
              <span className={styles['menu-item-label']}>
                {isCheckbox && <span className={styles['check-icon']}>{node.checked ? <CheckOutlined /> : null}</span>}
                {label}
              </span>
              {isSubmenu && <RightOutlined className={styles['arrow-icon']} />}
            </li>
          );
        })}
      </ul>
    </Drawer>
  );
}
