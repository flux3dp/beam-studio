import React from 'react';

import { Alert, Button } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

interface Props {
  onRetry: () => void;
}

const ErrorView = ({ onRetry }: Props) => {
  const t = useI18n().beambox.ai_generate;

  return (
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
  );
};

export default ErrorView;
