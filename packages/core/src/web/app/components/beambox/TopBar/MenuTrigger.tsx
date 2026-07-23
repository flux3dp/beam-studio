import React from 'react';

import classNames from 'classnames';

import { tryExitingExploreMode } from '@core/app/stores/interactionModeStore';

import styles from './MenuTrigger.module.scss';

interface Props {
  disabled?: boolean;
  onClick?: () => void;
  ref?: React.Ref<HTMLButtonElement | HTMLDivElement>;
  type?: 'drawer' | 'dropdown';
}

const MenuTrigger = ({ disabled, onClick, ref, type }: Props): React.JSX.Element => {
  return type === 'dropdown' ? (
    <div
      className={classNames(styles['menu-btn-container'], { [styles.disabled]: disabled })}
      onClick={disabled ? tryExitingExploreMode : onClick}
      ref={ref as React.Ref<HTMLDivElement>}
    >
      <img className={styles.icon} src="img/logo-line.svg" />
      {!disabled && <img className={styles['icon-arrow']} src="img/icon-arrow-d.svg" />}
    </div>
  ) : (
    <button
      className={classNames(styles.trigger, { [styles.disabled]: disabled })}
      data-testid="drawer-menu-trigger"
      onClick={disabled ? tryExitingExploreMode : onClick}
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
    >
      <img className={styles['trigger-logo']} src="core-img/beam-studio-logo.svg" />
      {!disabled && (
        <span className={styles['trigger-hamburger']}>
          <span />
          <span />
          <span />
        </span>
      )}
    </button>
  );
};

export default MenuTrigger;
