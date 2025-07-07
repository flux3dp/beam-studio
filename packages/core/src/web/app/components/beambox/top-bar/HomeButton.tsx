import React from 'react';

import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';

import styles from './DocumentButton.module.scss';

const HomeButton = () => {
  const showWelcomePage = () => {
    window.location.hash = '#/studio/welcome';
  };

  return (
    <div className={styles.button} onClick={showWelcomePage} title={'Home'}>
      <TopBarIcons.Home />
    </div>
  );
};

export default HomeButton;
