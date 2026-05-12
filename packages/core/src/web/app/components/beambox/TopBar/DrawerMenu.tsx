import React, { useMemo, useRef, useState } from 'react';

import { CheckOutlined, CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Drawer } from 'antd';

import { MenuEvents } from '@core/app/constants/ipcEvents';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import communicator from '@core/implementations/communicator';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import styles from './DrawerMenu.module.scss';
import type { MenuNode } from './useMenuData';
import useMenuData from './useMenuData';

interface Props {
  email?: string;
}

const ROOT_TITLE = 'Beam Studio';

export default function DrawerMenu({ email }: Props): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const menuData = useMenuData(email);
  const menuCms = useI18n().topbar.menu;
  const [navStack, setNavStack] = useState<number[]>([]);
  const pendingAction = useRef<null | { device?: IDeviceInfo; id: string }>(null);

  const { currentNodes, currentTitle } = useMemo(() => {
    let nodes = menuData;
    let title = ROOT_TITLE;

    for (const index of navStack) {
      const node = nodes[index];

      if (!node || node.type !== 'submenu' || !node.children) {
        break;
      }

      title = node.label ?? title;
      nodes = node.children;
    }

    return { currentNodes: nodes, currentTitle: title };
  }, [menuData, navStack]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleAfterOpenChange = (opened: boolean) => {
    if (opened) return;

    setNavStack([]);

    if (!pendingAction.current) return;

    const { device, id } = pendingAction.current;
    const payload = {
      id,
      machineName: device?.name,
      serial: device?.serial,
      uuid: device?.uuid,
    };

    pendingAction.current = null;

    if (isWeb()) {
      eventEmitterFactory.createEventEmitter('top-bar-menu').emit(MenuEvents.MenuClick, null, payload);
    } else {
      communicator.send(MenuEvents.MenuClick, payload);
    }
  };

  const handleBack = () => setNavStack((prev) => prev.slice(0, -1));

  const handleNodeClick = (node: MenuNode, index: number) => {
    if (node.disabled) return;

    if (node.type === 'submenu' && node.children) {
      setNavStack((prev) => [...prev, index]);

      return;
    }

    if (node.url) {
      browser.open(node.url);
      close();

      return;
    }

    if (node.id) {
      pendingAction.current = { device: node.device, id: node.id };
      close();
    }
  };

  const getNodeLabel = (node: MenuNode): string => {
    if (node.label) return node.label;

    if (node.hotkey) return menuCms[node.hotkey] ?? '';

    return '';
  };

  const hasCheckbox = currentNodes.some((node) => node.type === 'checkbox');

  return (
    <>
      <button className={styles.trigger} data-testid="drawer-menu-trigger" onClick={open} type="button">
        <img className={styles['trigger-logo']} src="core-img/beam-studio-logo.svg" />
        <span className={styles['trigger-hamburger']}>
          <span />
          <span />
          <span />
        </span>
      </button>
      <Drawer
        afterOpenChange={handleAfterOpenChange}
        closable={false}
        onClose={close}
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
            <button className={styles['close-button']} onClick={close} type="button">
              <CloseOutlined />
            </button>
          </div>
        }
        width={320}
      >
        <ul className={styles['menu-list']}>
          {currentNodes.map((node, index) => {
            if (node.visible === false) return null;

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
                onClick={() => handleNodeClick(node, index)}
              >
                <span className={styles['menu-item-label']}>
                  {hasCheckbox && (
                    <span className={styles['check-icon']}>
                      {isCheckbox && node.checked ? <CheckOutlined /> : null}
                    </span>
                  )}
                  {label}
                </span>
                {isSubmenu && <RightOutlined className={styles['arrow-icon']} />}
              </li>
            );
          })}
        </ul>
      </Drawer>
    </>
  );
}
