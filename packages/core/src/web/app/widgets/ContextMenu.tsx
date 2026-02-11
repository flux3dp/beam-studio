import React from 'react';
import type { ReactNode } from 'react';

import { ConfigProvider, Dropdown } from 'antd';
import type { DropdownProps, MenuProps } from 'antd';

interface ContextMenuProps {
  children: ReactNode;
  disabled?: boolean;
  items: MenuProps['items'];
  onClick?: MenuProps['onClick'];
  trigger?: DropdownProps['trigger'];
}

const ContextMenu = ({ children, disabled, items, onClick, trigger = ['contextMenu'] }: ContextMenuProps) => (
  <ConfigProvider
    theme={{ components: { Dropdown: { controlHeight: 20, controlPaddingHorizontal: 16, fontSize: 12 } } }}
  >
    <Dropdown disabled={disabled} menu={{ items, onClick }} trigger={trigger}>
      {children}
    </Dropdown>
  </ConfigProvider>
);

export default ContextMenu;
