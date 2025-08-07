import React from 'react';

import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import fileExportHelper from '@core/helpers/file/export';
import { hashMap } from '@core/helpers/hashHelper';

import styles from './WelcomePageButton.module.scss';

const WelcomePageButton = () => {
  const showWelcomePage = async () => {
    const res = await fileExportHelper.toggleUnsavedChangedDialog();

    if (res) {
      window.location.hash = hashMap.welcome;
      currentFileManager.setHasUnsavedChanges(false);
      window.location.reload();
    }
  };

  return (
    <div className={styles.button} onClick={showWelcomePage}>
      <TopBarIcons.Home />
    </div>
  );
};

export default WelcomePageButton;
