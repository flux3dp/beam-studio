import type { ReactNode } from 'react';
import React from 'react';

import classNames from 'classnames';

import styles from './SetupPageLayout.module.scss';
import TopBarPlaceHolder from './TopBarPlaceHolder';

export interface SetupPageButtonConfig {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface SetupPageLayoutProps {
  buttons?: SetupPageButtonConfig[];
  children: ReactNode;
}

const SetupPageLayout = ({ buttons, children }: SetupPageLayoutProps): React.JSX.Element => (
  <div className={styles.container}>
    <TopBarPlaceHolder />
    <div className={styles.content}>{children}</div>
    {buttons && buttons.length > 0 && (
      <div className={styles.btns}>
        {buttons.map(({ disabled, label, onClick, primary }) => (
          <div
            className={classNames(styles.btn, { [styles.disabled]: disabled, [styles.primary]: primary })}
            key={label}
            onClick={disabled ? undefined : onClick}
          >
            {label}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default SetupPageLayout;
