import React from 'react';

import { Spin } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

const LoadingView = () => {
  const t = useI18n().beambox.ai_generate;

  return (
    <div className={styles.content} style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Spin size="large" tip={t.loading.styles} />
    </div>
  );
};

export default LoadingView;
