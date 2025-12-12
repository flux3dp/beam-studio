import React from 'react';

import { Alert, Button } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

import Header from './Header';

const ErrorView = ({ contentRef, onRetry }: { contentRef: React.RefObject<HTMLDivElement>; onRetry: () => void }) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  return (
    <div className={classNames(styles['ai-generate-container'])}>
      <Header contentRef={contentRef} />
      <div className={styles.content}>
        <Alert
          action={
            <Button onClick={onRetry} size="small" type="primary">
              {t.retry}
            </Button>
          }
          description={t.error.config_description}
          message={t.error.config_message}
          showIcon
          type="error"
        />
      </div>
    </div>
  );
};

export default ErrorView;
