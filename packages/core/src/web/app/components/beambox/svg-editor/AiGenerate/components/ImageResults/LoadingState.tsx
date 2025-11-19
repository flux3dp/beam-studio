import { Spin } from 'antd';

import styles from './index.module.scss';

export const LoadingState = () => (
  <div className={styles['loading-container']}>
    <Spin size="large" />
    <p className={styles['loading-text']}>Generating your images...</p>
  </div>
);
