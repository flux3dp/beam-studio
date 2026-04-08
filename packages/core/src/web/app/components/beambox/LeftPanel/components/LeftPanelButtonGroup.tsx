import React, { useCallback, useRef, useState } from 'react';

import { Popover } from 'antd';
import classNames from 'classnames';

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
  title: string;
}

const LONG_PRESS_DURATION = 500;

function LeftPanelButtonGroup({ active = false, id, options, title }: Props): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string>(options[0]?.id);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const longPressTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const longPressTriggeredRef = useRef(false);

  const selectedOption = options.find((opt) => opt.id === selectedId) ?? options[0];

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = () => {
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      longPressTriggeredRef.current = true;
      setPopoverOpen(true);
    }, LONG_PRESS_DURATION);
  };

  const handleCancelLongPress = () => {
    clearLongPressTimer();
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent antd's click trigger from auto-toggling the popover.
    e.stopPropagation();

    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;

      return;
    }

    selectedOption?.onClick();
  };

  const handleOptionClick = useCallback((option: ToolOption) => {
    setSelectedId(option.id);
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
          onPointerCancel={handleCancelLongPress}
          onPointerDown={handlePointerDown}
          onPointerLeave={handleCancelLongPress}
          onPointerUp={handleCancelLongPress}
          title={selectedOption?.title || selectedOption?.label || title}
        >
          {selectedOption?.icon}
          <div className={styles.indicator} />
        </div>
      </div>
    </Popover>
  );
}

export default LeftPanelButtonGroup;
