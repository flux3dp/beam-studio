import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Popover } from 'antd';
import classNames from 'classnames';

import shortcuts from '@core/helpers/shortcuts';

import buttonStyles from './LeftPanelButton.module.scss';
import styles from './LeftPanelButtonGroup.module.scss';

const LONG_PRESS_DELAY = 500;

interface ToolOption {
  icon: React.ReactNode;
  id: string;
  label: string;
  onClick: () => void;
  title?: string;
}

interface Props {
  active?: boolean;
  id: string;
  options: ToolOption[];
  shortcut?: string;
}

function LeftPanelButtonGroup({ active = false, id, options, shortcut }: Props): React.JSX.Element {
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const pressTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  // Set once the press passes LONG_PRESS_DELAY, so the click that follows the
  // release is swallowed instead of acting on the button. Reset on every mousedown,
  // which always precedes the click, so it can never go stale.
  const longPressedRef = useRef(false);

  useEffect(() => {
    if (!shortcut) return;

    return shortcuts.on([shortcut.toLowerCase()], () => {
      selectedOption.onClick();
    });
  }, [selectedOption, shortcut]);

  const clearPressTimer = useCallback(() => {
    if (pressTimerRef.current === null) return;

    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  }, []);

  useEffect(() => {
    // A release anywhere ends the press, even outside the button.
    document.addEventListener('mouseup', clearPressTimer);

    return () => {
      document.removeEventListener('mouseup', clearPressTimer);
      clearPressTimer();
    };
  }, [clearPressTimer]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      // Keep the press from starting a native drag or text selection.
      e.preventDefault();
      clearPressTimer();
      longPressedRef.current = false;
      pressTimerRef.current = setTimeout(() => {
        longPressedRef.current = true;
        setPopoverOpen(true);
      }, LONG_PRESS_DELAY);
    },
    [clearPressTimer],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent antd's click trigger from auto-toggling the popover.
      e.stopPropagation();

      if (longPressedRef.current) return;

      selectedOption?.onClick();
      setPopoverOpen(false);
    },
    [selectedOption],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPopoverOpen(true);
  }, []);

  const handleOptionSelect = useCallback((option: ToolOption) => {
    setSelectedOption(option);
    setPopoverOpen(false);
    option.onClick();
  }, []);

  const content = (
    <div>
      {options.map((option) => (
        <div
          className={styles.option}
          id={`tool-option-${option.id}`}
          key={option.id}
          // Selecting on mouseup covers both a plain click on the option and a
          // long-press on the button dragged onto it, where no click ever fires.
          onMouseUp={() => handleOptionSelect(option)}
          title={option.title || option.label}
        >
          <div className={styles.optionIcon}>{option.icon}</div>
          {option.label}
        </div>
      ))}
    </div>
  );

  const title = useMemo(() => {
    let base = selectedOption?.title || selectedOption?.label;

    if (!base) return undefined;

    if (shortcut) {
      base += ` (${shortcut})`;
    }

    return base;
  }, [selectedOption, shortcut]);

  return (
    <Popover
      arrow={false}
      classNames={{ root: styles.popover }}
      content={content}
      onOpenChange={setPopoverOpen}
      open={popoverOpen}
      placement="right"
      trigger="click"
    >
      <div className={classNames(styles.wrapper, { [styles.active]: active })}>
        <div
          className={classNames(buttonStyles.container, { [buttonStyles.active]: active })}
          id={id}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          title={title}
        >
          {selectedOption?.icon}
          <div className={styles.indicator} />
        </div>
      </div>
    </Popover>
  );
}

export default LeftPanelButtonGroup;
