import React from 'react';

import browser from '@core/implementations/browser';

import styles from './GridGuide.module.scss';

interface Props {
  baseUrl: string;
  guide: {
    category: number;
    name: string;
    src: string;
  };
}

const GridGuide = ({ baseUrl, guide }: Props): React.JSX.Element => {
  return (
    <div className={styles.grid} onClick={() => browser.open(`${baseUrl}/categories/${guide.category}`)}>
      <img alt={guide.name} className={styles.image} src={guide.src} />
      <div className={styles.name}>{guide.name}</div>
    </div>
  );
};

export default GridGuide;
