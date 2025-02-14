import { useContext } from 'react';

import { CanvasContext } from '@core/app/contexts/CanvasContext';
import useI18n from '@core/helpers/useI18n';

import styles from './Banner.module.scss';

const Banner = () => {
  const lang = useI18n();
  const { mode } = useContext(CanvasContext);

  const messages: string = [];

  return <div className={styles.container}>Banner</div>;
};

export default Banner;
