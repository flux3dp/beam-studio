import React, { useMemo } from 'react';

import { MenuDivider, MenuItem, SubMenu, Menu as TopBarMenu } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';

import { MenuEvents } from '@core/app/constants/ipcEvents';
import { menuItems } from '@core/app/constants/menuItems';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import styles from './Menu.module.scss';
import MenuTrigger from './MenuTrigger';
import type { MenuNode } from './useMenuData';
import useMenuData from './useMenuData';

interface Props {
  disabled?: boolean;
  email?: string;
}

export default function Menu({ disabled, email }: Props): React.JSX.Element {
  const eventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('top-bar-menu'), []);
  const menuData = useMenuData(email);
  const menuCms = useI18n().topbar.menu;

  const callback = (id: string, device?: IDeviceInfo) => {
    eventEmitter.emit(MenuEvents.MenuClick, null, {
      id,
      machineName: device?.name,
      serial: device?.serial,
      uuid: device?.uuid,
    });
  };

  const getLabel = (node: MenuNode): React.ReactNode => {
    if (node.hotkey) {
      return (
        <>
          <span className={styles.action}>{menuCms[node.hotkey]}</span>
          <span className={styles.hotkey}>{menuItems[node.hotkey]?.representation}</span>
        </>
      );
    }

    return node.label ?? '';
  };

  const handleItemClick = (node: MenuNode) => {
    if (node.url) {
      browser.open(node.url);

      return;
    }

    if (node.id) callback(node.id, node.device);
  };

  const renderNode = (node: MenuNode, index: number): React.ReactNode => {
    if (node.visible === false) return null;

    if (node.type === 'divider') return <MenuDivider key={`divider-${index}`} />;

    const key = node.id ?? `item-${index}`;

    if (node.type === 'submenu') {
      return (
        <SubMenu disabled={node.disabled} key={key} label={getLabel(node)}>
          {node.children?.map((child, i) => renderNode(child, i))}
        </SubMenu>
      );
    }

    if (node.type === 'checkbox') {
      return (
        <MenuItem
          checked={node.checked}
          disabled={node.disabled}
          key={key}
          onClick={() => handleItemClick(node)}
          type="checkbox"
        >
          {getLabel(node)}
        </MenuItem>
      );
    }

    return (
      <MenuItem disabled={node.disabled} key={key} onClick={() => handleItemClick(node)}>
        {getLabel(node)}
      </MenuItem>
    );
  };

  return (
    <TopBarMenu menuButton={<MenuTrigger disabled={disabled} type="dropdown" />} transition>
      {menuData.map((node, index) => renderNode(node, index))}
    </TopBarMenu>
  );
}
