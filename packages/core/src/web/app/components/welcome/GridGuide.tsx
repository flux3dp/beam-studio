import React from 'react';

import styles from './GridGuide.module.scss';

interface Props {
  guide: {
    category: number;
    name: string;
    src: string;
  };
}

const GridGuide = ({ guide }: Props): React.JSX.Element => {
  return (
    <div className={styles.grid}>
      <img alt={guide.name} className={styles.image} src={guide.src} />
      <div className={styles.name}>{guide.name}</div>
    </div>
  );
};

export default GridGuide;
