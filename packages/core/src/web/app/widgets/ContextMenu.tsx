import React, { useCallback, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

import { ConfigProvider, Dropdown } from 'antd';
import type { DropdownProps, MenuProps } from 'antd';

import { isIOS } from '@core/helpers/system-helper';

interface ContextMenuProps {
  children: ReactElement;
  disabled?: boolean;
  items: MenuProps['items'];
  onClick?: MenuProps['onClick'];
  trigger?: DropdownProps['trigger'];
}

const LONG_PRESS_DURATION = 500;
const MOVE_THRESHOLD = 10;
const DROPDOWN_THEME = { components: { Dropdown: { controlHeight: 20, controlPaddingHorizontal: 16, fontSize: 12 } } };
const isTouchDevice = () => typeof window !== 'undefined' && 'ontouchstart' in window;

let touchCloseRegistered = false;

const registerTouchClose = () => {
  if (!isTouchDevice() || touchCloseRegistered) return;

  touchCloseRegistered = true;
  document.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      // TODO(antd-v6): verify .ant-dropdown and .ant-dropdown-hidden class names still apply
      const popup = document.querySelector('.ant-dropdown:not(.ant-dropdown-hidden)');

      if (!popup) return;

      if (popup.contains(e.target as Node)) return;

      // Synthesize mousedown + click on document.body — @rc-component/trigger
      // listens for mousedown (via useWinClick) to dismiss context-menu-triggered
      // dropdowns. Mobile browsers don't reliably fire these from touch interactions.
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    { passive: true },
  );
};

const ContextMenu = ({ children, disabled, items, onClick, trigger = ['contextMenu'] }: ContextMenuProps) => {
  const needsLongPress = trigger.includes('contextMenu') && isIOS();
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const touchStartRef = useRef<null | { x: number; y: number }>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    touchStartRef.current = null;
  }, []);

  useEffect(() => {
    if (!needsLongPress || disabled) return undefined;

    const el = wrapperRef.current;

    if (!el) return undefined;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];

      if (!touch) return;

      const target = e.target as Element;

      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      timerRef.current = setTimeout(() => {
        // Dispatch synthetic contextmenu on the original touch target so it
        // bubbles through the DOM (e.g. #workarea captures the position for
        // paste via setLastClickPoint) before reaching Dropdown's trigger.
        if (!target.isConnected) return;

        target.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            clientX: touch.clientX,
            clientY: touch.clientY,
          }),
        );
        timerRef.current = null;
      }, LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !timerRef.current) return;

      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
        clearTimer();
      }
    };

    const handleTouchEnd = () => {
      clearTimer();
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      clearTimer();
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [needsLongPress, disabled, clearTimer]);

  useEffect(() => {
    registerTouchClose();
  }, []);

  const content = needsLongPress ? (
    <div ref={wrapperRef} style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}>
      {children}
    </div>
  ) : (
    children
  );

  return (
    <ConfigProvider theme={DROPDOWN_THEME}>
      <Dropdown disabled={disabled} menu={{ items, onClick }} trigger={trigger}>
        {content}
      </Dropdown>
    </ConfigProvider>
  );
};

export default ContextMenu;
