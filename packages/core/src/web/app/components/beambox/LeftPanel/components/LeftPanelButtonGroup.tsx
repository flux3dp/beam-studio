import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Popover } from 'antd';
import classNames from 'classnames';

import shortcuts from '@core/helpers/shortcuts';

import buttonStyles from './LeftPanelButton.module.scss';
import styles from './LeftPanelButtonGroup.module.scss';

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

const LONG_PRESS_DURATION = 500;

function LeftPanelButtonGroup({ active = false, id, options, shortcut }: Props): React.JSX.Element {
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    if (!shortcut) return;

    return shortcuts.on([shortcut.toLowerCase()], () => {
      selectedOption.onClick();
    });
  }, [selectedOption, shortcut]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePointerEnter = () => {
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      longPressTriggeredRef.current = true;
      setPopoverOpen(true);
    }, LONG_PRESS_DURATION);
  };

  const handleCancelPopOver = () => {
    clearLongPressTimer();
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent antd's click trigger from auto-toggling the popover.
      e.stopPropagation();

      // Does current mouse down trigger a long press? If so, we should not trigger the click action.
      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false;

        return;
      }

      selectedOption?.onClick();
      setPopoverOpen(false);
    },
    [selectedOption],
  );

  const handleOptionClick = useCallback((option: ToolOption) => {
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
          onClick={() => handleOptionClick(option)}
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
          onPointerCancel={handleCancelPopOver}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handleCancelPopOver}
          onPointerUp={handleCancelPopOver}
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
