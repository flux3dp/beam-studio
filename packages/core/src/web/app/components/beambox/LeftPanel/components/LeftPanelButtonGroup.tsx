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
  const showPopoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!shortcut) return;

    return shortcuts.on([shortcut.toLowerCase()], () => {
      selectedOption.onClick();
    });
  }, [selectedOption, shortcut]);

  const clearPopoverTimer = useCallback(() => {
    if (showPopoverTimerRef.current) {
      clearTimeout(showPopoverTimerRef.current);
      showPopoverTimerRef.current = null;
    }
  }, []);

  const handlePointerEnter = () => {
    clearPopoverTimer();
    showPopoverTimerRef.current = setTimeout(() => {
      showPopoverTimerRef.current = null;
      setPopoverOpen(true);
    }, LONG_PRESS_DURATION);
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent antd's click trigger from auto-toggling the popover.
      e.stopPropagation();
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
          onPointerCancel={clearPopoverTimer}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={clearPopoverTimer}
          onPointerUp={clearPopoverTimer}
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
