import React from 'react';

import { Alert, Button } from 'antd';
import classNames from 'classnames';

import styles from '../index.module.scss';

import Header from './Header';

const ErrorView = ({ onClose, onRetry }: { onClose: () => void; onRetry: () => void }) => (
  <div className={classNames(styles['ai-generate-container'])}>
    <Header onClose={onClose} />
    <div className={styles.content}>
      <Alert
        action={
          <Button onClick={onRetry} size="small" type="primary">
            Retry
          </Button>
        }
        description="Failed to load AI configuration"
        message="Failed to load AI styles"
        showIcon
        type="error"
      />
    </div>
  </div>
);

export default ErrorView;
