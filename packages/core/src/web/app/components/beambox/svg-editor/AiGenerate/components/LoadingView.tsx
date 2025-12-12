import React from 'react';

import { Spin } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

import Header from './Header';

const LoadingView = ({ contentRef }: { contentRef: React.RefObject<HTMLDivElement> }) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  return (
    <div className={classNames(styles['ai-generate-container'])}>
      <Header contentRef={contentRef} />
      <div className={styles.content} style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spin size="large" tip={t.loading.styles} />
      </div>
    </div>
  );
};

export default LoadingView;
