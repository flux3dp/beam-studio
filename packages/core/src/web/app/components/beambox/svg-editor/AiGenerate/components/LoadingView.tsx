import React from 'react';

import { Spin } from 'antd';
import classNames from 'classnames';

import styles from '../index.module.scss';

import Header from './Header';

const LoadingView = ({ onClose }: { onClose: () => void }) => (
  <div className={classNames(styles['ai-generate-container'])}>
    <Header onClose={onClose} />
    <div className={styles.content} style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Spin size="large" tip="Loading AI styles..." />
    </div>
  </div>
);

export default LoadingView;
