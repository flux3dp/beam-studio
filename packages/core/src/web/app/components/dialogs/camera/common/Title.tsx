import React, { memo, useCallback } from 'react';

import AlertIcons from '@core/app/icons/alerts/AlertIcons';
import browser from '@core/implementations/browser';

import styles from './Title.module.scss';

interface Props {
  link?: string;
  title: string;
}

const Title = ({ link, title }: Props): React.ReactNode => {
  const openLink = useCallback(() => {
    if (link) {
      browser.open(link);
    }
  }, [link]);

  if (!link) {
    return title;
  }

  return (
    <div className={styles.title}>
      {title}
      <AlertIcons.ExtLink className={styles.icon} onClick={openLink} />
    </div>
  );
};

export default memo(Title);
