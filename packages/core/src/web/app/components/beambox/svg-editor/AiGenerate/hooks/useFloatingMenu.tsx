import { useEffect, useRef, useState } from 'react';

interface MenuPosition {
  left: number;
  top: number;
}

interface UseFloatingMenuOptions {
  /** Delay in milliseconds before closing the menu after mouse leave */
  closeDelay?: number;
  /** Horizontal offset from the button in pixels */
  horizontalOffset?: number;
}

interface UseFloatingMenuReturn {
  /** Reference to attach to the trigger button element */
  buttonRef: React.RefObject<HTMLDivElement>;
  closeMenu: () => void;
  handleButtonEnter: () => void;
  handleButtonLeave: () => void;
  handleMenuEnter: () => void;
  handleMenuLeave: () => void;
  /** Current menu position (null when menu is hidden) */
  menuPosition: MenuPosition | null;
  showMenu: boolean;
}

export const useFloatingMenu = ({
  closeDelay = 300,
  horizontalOffset = 90,
}: UseFloatingMenuOptions = {}): UseFloatingMenuReturn => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const closeMenu = () => {
    setShowMenu(false);
    setMenuPosition(null);
  };

  const handleButtonEnter = () => {
    clearCloseTimeout();

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setMenuPosition({ left: rect.left + horizontalOffset, top: rect.top });
    }

    setShowMenu(true);
  };

  const handleButtonLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      closeMenu();
    }, closeDelay);
  };

  const handleMenuEnter = () => {
    clearCloseTimeout();
  };

  const handleMenuLeave = () => {
    closeMenu();
  };

  useEffect(() => clearCloseTimeout, []);

  return {
    buttonRef,
    closeMenu,
    handleButtonEnter,
    handleButtonLeave,
    handleMenuEnter,
    handleMenuLeave,
    menuPosition,
    showMenu,
  };
};
