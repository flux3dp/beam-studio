import React from 'react';

import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';

import styles from './DocumentButton.module.scss';

const HomeButton = (): React.JSX.Element => {
  const showWelcomePage = () => {
    window.location.hash = '#/welcome';
  };

  return (
    <div className={styles.button} onClick={showWelcomePage} title={'Home'}>
      <TopBarIcons.Home />
    </div>
  );
};

export default HomeButton;
