import React, { memo, useCallback } from 'react';

import AlertIcons from 'app/icons/alerts/AlertIcons';
import browser from 'implementations/browser';

import styles from './Title.module.scss';

interface Props {
  title: string;
  link?: string;
}

const Title = ({ title, link }: Props): React.ReactNode => {
  const openLink = useCallback(() => {
    if (link) browser.open(link);
  }, [link]);
  if (!link) return title;
  return (
    <div className={styles.title}>
      {title}
      <AlertIcons.ExtLink className={styles.icon} onClick={openLink} />
    </div>
  );
};

export default memo(Title);
