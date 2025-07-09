import React from 'react';

import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { todo } from '@core/helpers/dev-helper';
import fileExportHelper from '@core/helpers/file-export-helper';
import isWeb from '@core/helpers/is-web';

import styles from './WelcomePageButton.module.scss';

const WelcomePageButton = () => {
  const showWelcomePage = async () => {
    if (isWeb()) {
      const res = await fileExportHelper.toggleUnsavedChangedDialog();

      if (res) {
        window.location.hash = '#/studio/welcome';
      }
    } else {
      todo('showWelcomePage', 'move to welcome page');
    }
  };

  return (
    <div className={styles.button} onClick={showWelcomePage}>
      <TopBarIcons.Home />
    </div>
  );
};

export default WelcomePageButton;
