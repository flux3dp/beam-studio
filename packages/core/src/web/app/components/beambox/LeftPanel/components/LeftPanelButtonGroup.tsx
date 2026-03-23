import React from 'react';

import { Popover } from 'antd';
import classNames from 'classnames';

import buttonStyles from './LeftPanelButton.module.scss';
import styles from './LeftPanelButtonGroup.module.scss';

interface ToolOption {
  icon: React.ReactNode;
  id: string;
  label: string;
  onClick: () => void;
}

interface Props {
  active?: boolean;
  icon: React.ReactNode;
  id: string;
  options: ToolOption[];
  title: string;
}

function LeftPanelButtonGroup({ active = false, icon, id, options, title }: Props): React.JSX.Element {
  const content = (
    <div className={styles.popoverContent}>
      {options.map((option) => (
        <div className={styles.option} key={option.id} onClick={option.onClick} title={option.label}>
          <div className={styles.optionIcon}>{option.icon}</div>
          {option.label}
        </div>
      ))}
    </div>
  );

  return (
    <Popover arrow={false} classNames={{ root: styles.popover }} content={content} placement="right" trigger="hover">
      <div className={classNames(styles.wrapper, { [styles.active]: active })}>
        <div className={classNames(buttonStyles.container, { [buttonStyles.active]: active })} id={id} title={title}>
          {icon}
          <div className={styles.indicator} />
        </div>
      </div>
    </Popover>
  );
}

export default LeftPanelButtonGroup;
