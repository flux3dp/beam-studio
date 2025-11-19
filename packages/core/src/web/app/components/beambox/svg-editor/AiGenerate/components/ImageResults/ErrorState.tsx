import { Alert, Button } from 'antd';

import browser from '@core/implementations/browser';

import styles from './index.module.scss';

export const ErrorState = ({
  displayErrorMessage,
  errorMessage,
  isInsufficientCredits,
  lang,
}: {
  displayErrorMessage: null | string;
  errorMessage: null | string;
  isInsufficientCredits: boolean;
  lang: any;
}) => {
  if (!errorMessage) return null;

  if (isInsufficientCredits) {
    return (
      <Alert
        closable
        description={
          <div className={styles['error-div']}>
            <span>{displayErrorMessage}</span>
            <Button
              onClick={() => browser.open(lang.flux_id_login.flux_plus.member_center_url)}
              size="small"
              type="primary"
            >
              {lang.flux_id_login.flux_plus.goto_member_center}
            </Button>
          </div>
        }
        message="Insufficient Credits"
        showIcon
        type="warning"
      />
    );
  }

  return <Alert closable description={displayErrorMessage} message="Generation Failed" showIcon type="error" />;
};
